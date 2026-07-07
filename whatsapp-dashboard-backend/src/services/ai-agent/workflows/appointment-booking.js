const logger = require("../../../config/logger");
const db = require("../../../config/db");
const { v4: uuidv4 } = require("uuid");
const webhookHandler = require("../webhook-handler");

/**
 * Appointment Booking Workflow
 * Handles calendar integration and automated appointment scheduling
 */
class AppointmentBookingWorkflow {
  /**
   * Execute appointment booking workflow
   */
  async execute(params) {
    const {
      workspaceId,
      conversationId,
      phoneNumber,
      senderName,
      analysis,
      accessToken,
      phoneNumberId,
    } = params;

    const steps = [];

    try {
      // Step 1: Extract booking information
      const bookingData = this.extractBookingData(phoneNumber, analysis);
      steps.push({
        step_name: "extract_booking_info",
        status: "completed",
        data: bookingData,
      });

      // Step 2: Get available slots from calendar
      const availableSlots = await this.getAvailableSlots(workspaceId);

      if (availableSlots.length === 0) {
        steps.push({
          step_name: "get_availability",
          status: "failed",
          reason: "No available slots",
        });

        await webhookHandler.sendMessage(
          phoneNumber,
          "Sorry, no appointments available right now. Please try again later!",
          accessToken,
          phoneNumberId,
        );

        return {
          status: "failed",
          message: "No available slots",
          steps,
        };
      }

      steps.push({
        step_name: "get_availability",
        status: "completed",
        slots_count: availableSlots.length,
      });

      // Step 3: Send booking flow with available slots
      const bookingFlow = await this.getBookingFlow(workspaceId);

      if (bookingFlow && bookingFlow.meta_flow_id) {
        // Send interactive Flow
        const sendResult = await webhookHandler.sendFlow(
          phoneNumber,
          bookingFlow.meta_flow_id,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_booking_flow",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      } else {
        // Send text message with available times
        const message = this.generateBookingMessage(availableSlots);

        const sendResult = await webhookHandler.sendMessage(
          phoneNumber,
          message,
          accessToken,
          phoneNumberId,
        );

        steps.push({
          step_name: "send_availability_message",
          status: sendResult.success ? "completed" : "failed",
          result: sendResult,
        });
      }

      // Step 4: Create pending appointment record
      const appointmentId = uuidv4();
      await db.query(
        `INSERT INTO appointments 
         (id, workspace_id, conversation_id, phone_number, customer_name, status, source)
         VALUES (?, ?, ?, ?, ?, 'pending_confirmation', 'whatsapp')`,
        [appointmentId, workspaceId, conversationId, phoneNumber, senderName],
      );

      steps.push({
        step_name: "create_appointment_record",
        status: "completed",
        appointment_id: appointmentId,
      });

      return {
        status: "completed",
        appointment_id: appointmentId,
        message: "Booking flow sent successfully",
        steps,
      };
    } catch (error) {
      logger.error("[Appointment Booking] Workflow error:", error);

      steps.push({
        step_name: "error_handler",
        status: "failed",
        error: error.message,
      });

      return {
        status: "failed",
        message: error.message,
        steps,
      };
    }
  }

  /**
   * Extract booking information from analysis
   * @private
   */
  extractBookingData(phoneNumber, analysis) {
    return {
      phone: phoneNumber,
      preferred_date: analysis?.entities?.date_mentioned || null,
      preferred_time: null,
      duration_minutes: 30, // default
      purpose: analysis?.entities?.product_interest || "General inquiry",
    };
  }

  /**
   * Get available appointment slots
   * @private
   */
  async getAvailableSlots(workspaceId, daysAhead = 14) {
    try {
      // Get workspace business hours
      const [settings] = await db.query(
        `SELECT business_hours, timezone FROM workspace_settings 
         WHERE workspace_id = ? LIMIT 1`,
        [workspaceId],
      );

      if (settings.length === 0) {
        // Default business hours: 9 AM - 5 PM
        return this.generateDefaultSlots(daysAhead);
      }

      const hours = settings[0].business_hours || {
        start: "09:00",
        end: "17:00",
        break_start: "12:00",
        break_end: "13:00",
      };

      const slots = [];
      const now = new Date();

      for (let day = 1; day <= daysAhead; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Generate slots for this day
        const daySlots = this.generateDaySlots(date, hours);

        // Filter out booked slots
        for (const slot of daySlots) {
          const isBooked = await this.isSlotBooked(workspaceId, slot.datetime);
          if (!isBooked) {
            slots.push(slot);
          }
        }

        // Return first 10 available slots
        if (slots.length >= 10) break;
      }

      return slots.slice(0, 10);
    } catch (error) {
      logger.error("[Appointment Booking] Error getting slots:", error);
      return this.generateDefaultSlots(daysAhead);
    }
  }

  /**
   * Generate default appointment slots
   * @private
   */
  generateDefaultSlots(daysAhead) {
    const slots = [];
    const now = new Date();

    for (let day = 1; day <= daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);

      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Generate 30-minute slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotDate = new Date(date);
          slotDate.setHours(hour, minute, 0);

          slots.push({
            datetime: slotDate.toISOString(),
            display: slotDate.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }),
          });
        }
      }

      if (slots.length >= 10) break;
    }

    return slots.slice(0, 10);
  }

  /**
   * Generate slots for a specific day
   * @private
   */
  generateDaySlots(date, hours) {
    const slots = [];
    const [startHour, startMin] = hours.start.split(":").map(Number);
    const [endHour, endMin] = hours.end.split(":").map(Number);
    const [breakStart, breakEnd] = hours.break_start
      ? hours.break_start.split(":").map(Number)
      : [12, 13];
    const [breakEndHour, breakEndMin] = hours.break_end
      ? hours.break_end.split(":").map(Number)
      : [13, 13];

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip break time
        if (hour === breakStart && minute >= breakEnd) continue;
        if (hour < breakStart || (hour === breakStart && minute < breakStart)) {
          // Before break
        }

        if (hour > endHour || (hour === endHour && minute >= endMin)) break;

        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0);

        slots.push({
          datetime: slotDate.toISOString(),
          display: slotDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }
    }

    return slots;
  }

  /**
   * Check if slot is already booked
   * @private
   */
  async isSlotBooked(workspaceId, datetime) {
    try {
      const [result] = await db.query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE workspace_id = ? AND scheduled_at = ? 
         AND status IN ('confirmed', 'completed')`,
        [workspaceId, datetime],
      );

      return result[0].count > 0;
    } catch (error) {
      logger.error("[Appointment Booking] Error checking slot:", error);
      return false;
    }
  }

  /**
   * Get booking flow for workspace
   * @private
   */
  async getBookingFlow(workspaceId) {
    try {
      const [flows] = await db.query(
        `SELECT * FROM whatsapp_flows
         WHERE workspace_id = ? AND flow_type = 'appointment_booking' 
         AND status = 'published'
         LIMIT 1`,
        [workspaceId],
      );

      return flows[0] || null;
    } catch (error) {
      logger.error("[Appointment Booking] Error fetching flow:", error);
      return null;
    }
  }

  /**
   * Generate booking message with available slots
   * @private
   */
  generateBookingMessage(slots) {
    let message = "Great! Here are our available appointment times:\n\n";

    slots.slice(0, 5).forEach((slot, index) => {
      message += `${index + 1}. ${slot.display}\n`;
    });

    message += "\nReply with the number of your preferred time!";

    return message;
  }

  /**
   * Confirm appointment booking
   */
  async confirmBooking(params) {
    const {
      workspaceId,
      appointmentId,
      selectedSlot,
      customerName,
      phoneNumber,
    } = params;

    try {
      // Update appointment with selected time
      await db.query(
        `UPDATE appointments 
         SET scheduled_at = ?, status = 'confirmed', confirmed_at = NOW()
         WHERE id = ? AND workspace_id = ?`,
        [selectedSlot, appointmentId, workspaceId],
      );

      logger.info(
        `[Appointment Booking] Appointment confirmed: ${appointmentId}`,
      );

      return {
        status: "success",
        message: "Appointment confirmed!",
        appointment_id: appointmentId,
      };
    } catch (error) {
      logger.error("[Appointment Booking] Error confirming booking:", error);
      throw error;
    }
  }

  /**
   * Send appointment reminder
   */
  async sendReminder(appointmentId, accessToken, phoneNumberId) {
    try {
      const [appointments] = await db.query(
        `SELECT phone_number, scheduled_at FROM appointments 
         WHERE id = ?`,
        [appointmentId],
      );

      if (appointments.length === 0) return;

      const appointment = appointments[0];
      const appointmentTime = new Date(appointment.scheduled_at);

      const message = `Reminder: You have an appointment scheduled for ${appointmentTime.toLocaleString()}. Looking forward to meeting you!`;

      await webhookHandler.sendMessage(
        appointment.phone_number,
        message,
        accessToken,
        phoneNumberId,
      );

      // Mark reminder as sent
      await db.query(
        `UPDATE appointments SET reminder_sent_at = NOW() WHERE id = ?`,
        [appointmentId],
      );

      return { success: true };
    } catch (error) {
      logger.error("[Appointment Booking] Error sending reminder:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get appointments for workspace
   */
  async getAppointments(workspaceId, status = null, limit = 50, offset = 0) {
    try {
      let query = `SELECT * FROM appointments WHERE workspace_id = ?`;
      const params = [workspaceId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY scheduled_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [appointments] = await db.query(query, params);

      return appointments;
    } catch (error) {
      logger.error("[Appointment Booking] Error fetching appointments:", error);
      return [];
    }
  }

  /**
   * Get booking statistics
   */
  async getStatistics(workspaceId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_shows
         FROM appointments
         WHERE workspace_id = ? AND created_at >= ?`,
        [workspaceId, startDate.toISOString().split("T")[0]],
      );

      return stats[0] || {};
    } catch (error) {
      logger.error("[Appointment Booking] Error fetching statistics:", error);
      return {};
    }
  }
}

module.exports = new AppointmentBookingWorkflow();
