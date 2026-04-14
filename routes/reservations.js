const express = require("express");
const router = express.Router();
const db = require("../database/db");
const adminGuard = require("../middleware/adminGuard");

const OPENING_HOUR = 17;
const CLOSING_HOUR = 21;
const SLOT_MINUTES = new Set([0, 30]);
const MAX_SEATS_PER_SLOT = 24;
const MODIFICATION_CUTOFF_HOURS = 2;
const ACTIVE_STATUSES = ["pending", "confirmed"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;
const ALLOWED_TYPES = new Set([
  "standard",
  "kaiseki",
  "omakase",
  "prix-fixe",
  "private-event",
]);
const ADMIN_STATUSES = new Set(["pending", "confirmed", "cancelled"]);

function normalizeDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
}

function normalizeTimeOnly(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return null;
  }

  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (!SLOT_MINUTES.has(minute)) return null;
  if (hour < OPENING_HOUR || hour > CLOSING_HOUR) return null;
  if (hour === CLOSING_HOUR && minute > 0) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function isPastDate(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dateValue}T00:00:00`).getTime() < today.getTime();
}

function buildConfirmationNumber(reservationId, dateValue) {
  const normalizedDate = dateValue instanceof Date
    ? dateValue.toISOString().slice(0, 10)
    : String(dateValue).slice(0, 10);

  return `KO-${normalizedDate.replace(/-/g, "")}-${String(reservationId).padStart(4, "0")}`;
}

function formatDateForResponse(dateValue) {
  return dateValue instanceof Date
    ? dateValue.toISOString().slice(0, 10)
    : String(dateValue).slice(0, 10);
}

function getReservationDateTime(dateValue, timeValue) {
  const datePart = formatDateForResponse(dateValue);
  const timePart = String(timeValue).slice(0, 8);
  return new Date(`${datePart}T${timePart}`);
}

function getCutoffDateTime(dateValue, timeValue) {
  const reservationDateTime = getReservationDateTime(dateValue, timeValue);
  return new Date(reservationDateTime.getTime() - MODIFICATION_CUTOFF_HOURS * 60 * 60 * 1000);
}

function canChangeReservation(dateValue, timeValue, status) {
  if (status === "cancelled") {
    return false;
  }

  return new Date() < getCutoffDateTime(dateValue, timeValue);
}

function normalizeOptionalText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildReservationNotes({ type, dietaryRestrictions, eventNotes }) {
  const lines = [
    "Submitted via reservation page.",
    `Dining Type: ${type}`,
  ];

  if (dietaryRestrictions) {
    lines.push(`Dietary Restrictions: ${dietaryRestrictions}`);
  }

  if (eventNotes) {
    lines.push(`Event Notes: ${eventNotes}`);
  }

  return lines.join("\n");
}

async function getReservationById(id) {
  const [rows] = await db.query(
    `SELECT
       id,
       customer_id,
       customer_name,
       customer_email,
       customer_phone,
       date,
       time,
       party_size,
       type,
       status,
       notes,
       dietary_restrictions,
       event_notes,
       created_at,
       updated_at
     FROM reservations
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function validateAvailability({ date, time, partySize, excludeReservationId = null }) {
  const params = [date, time, ...ACTIVE_STATUSES];
  let sql = `SELECT COALESCE(SUM(party_size), 0) AS reserved_seats
             FROM reservations
             WHERE date = ?
               AND time = ?
               AND status IN (${ACTIVE_STATUSES.map(() => "?").join(", ")})`;

  if (excludeReservationId) {
    sql += " AND id <> ?";
    params.push(excludeReservationId);
  }

  const [availabilityRows] = await db.query(sql, params);
  const reservedSeats = Number(availabilityRows[0]?.reserved_seats || 0);

  return reservedSeats + partySize <= MAX_SEATS_PER_SLOT;
}

function mapReservationForResponse(row) {
  return {
    ...row,
    date: formatDateForResponse(row.date),
    confirmation_number: buildConfirmationNumber(row.id, row.date),
    can_modify: canChangeReservation(row.date, row.time, row.status),
    can_cancel: canChangeReservation(row.date, row.time, row.status),
    cutoff_time: getCutoffDateTime(row.date, row.time).toISOString(),
  };
}

router.get("/admin", adminGuard, async (req, res) => {
  const dateFilter = normalizeDateOnly(req.query.date);
  const statusFilter = typeof req.query.status === "string" && req.query.status.trim()
    ? req.query.status.trim().toLowerCase()
    : "";

  if (req.query.date && !dateFilter) {
    return res.status(400).json({ message: "Enter a valid date filter." });
  }

  if (statusFilter && !ADMIN_STATUSES.has(statusFilter)) {
    return res.status(400).json({ message: "Enter a valid reservation status filter." });
  }

  const whereClauses = [];
  const params = [];

  if (dateFilter) {
    whereClauses.push("date = ?");
    params.push(dateFilter);
  }

  if (statusFilter) {
    whereClauses.push("status = ?");
    params.push(statusFilter);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  try {
    const [rows] = await db.query(
      `SELECT
         id,
         customer_id,
         customer_name,
         customer_email,
         customer_phone,
         date,
         time,
         party_size,
         type,
         status,
         notes,
         dietary_restrictions,
         event_notes,
         created_at,
         updated_at
       FROM reservations
       ${whereSql}
       ORDER BY date ASC, time ASC, created_at DESC`,
      params
    );

    res.json({ reservations: rows.map(mapReservationForResponse) });
  } catch (err) {
    console.error("GET /api/reservations/admin error:", err);
    res.status(500).json({ message: "Failed to load reservations." });
  }
});

router.get("/upcoming", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const [rows] = await db.query(
      `SELECT
         id,
         customer_name,
         customer_email,
         customer_phone,
         date,
         time,
         party_size,
         type,
         status,
         notes,
         dietary_restrictions,
         event_notes,
         created_at,
         updated_at
       FROM reservations
       WHERE customer_email = ?
         AND status <> 'cancelled'
         AND (
           date > CURDATE()
           OR (date = CURDATE() AND time >= CURTIME())
         )
       ORDER BY date ASC, time ASC`,
      [email]
    );

    res.json({
      reservations: rows.map(mapReservationForResponse),
    });
  } catch (err) {
    console.error("GET /api/reservations/upcoming error:", err);
    res.status(500).json({ message: "Failed to load upcoming reservations." });
  }
});

router.post("/", async (req, res) => {
  const {
    customer_id,
    date,
    time,
    party_size,
    type,
    name,
    email,
    phone,
    dietary_restrictions,
    event_notes,
    special_requests,
  } = req.body || {};

  const normalizedDate = normalizeDateOnly(date);
  const normalizedTime = normalizeTimeOnly(time);
  const normalizedPartySize = Number.parseInt(party_size, 10);
  const normalizedType = typeof type === "string" && type.trim() ? type.trim().toLowerCase() : "standard";
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  const normalizedDietaryRestrictions = normalizeOptionalText(dietary_restrictions);
  const normalizedEventNotes = normalizeOptionalText(event_notes || special_requests);

  if (!normalizedDate || isPastDate(normalizedDate)) {
    return res.status(400).json({ message: "Choose a valid reservation date." });
  }

  if (!normalizedTime) {
    return res.status(400).json({ message: "Choose a valid reservation time slot." });
  }

  if (!Number.isInteger(normalizedPartySize) || normalizedPartySize < 1 || normalizedPartySize > 12) {
    return res.status(400).json({ message: "Party size must be between 1 and 12 guests." });
  }

  if (!normalizedName) {
    return res.status(400).json({ message: "Full name is required." });
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return res.status(400).json({ message: "Enter a valid phone number." });
  }

  if (!ALLOWED_TYPES.has(normalizedType)) {
    return res.status(400).json({ message: "Choose a valid dining option." });
  }

  try {
    const isAvailable = await validateAvailability({
      date: normalizedDate,
      time: normalizedTime,
      partySize: normalizedPartySize,
    });

    if (!isAvailable) {
      return res.status(409).json({
        message: "That time slot is fully booked. Please choose another time.",
      });
    }

    const notes = buildReservationNotes({
      type: normalizedType,
      dietaryRestrictions: normalizedDietaryRestrictions,
      eventNotes: normalizedEventNotes,
    });

    const [result] = await db.query(
      `INSERT INTO reservations (
         customer_id,
         customer_name,
         customer_email,
         customer_phone,
         date,
         time,
         party_size,
         type,
         status,
         notes,
         dietary_restrictions,
         event_notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        customer_id || null,
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        normalizedDate,
        normalizedTime,
        normalizedPartySize,
        normalizedType,
        notes,
        normalizedDietaryRestrictions || null,
        normalizedEventNotes || null,
      ]
    );

    const confirmationNumber = buildConfirmationNumber(result.insertId, normalizedDate);

    res.status(201).json({
      message: "Reservation created successfully.",
      confirmation_number: confirmationNumber,
      reservation: {
        id: result.insertId,
        customer_id: customer_id || null,
        customer_name: normalizedName,
        customer_email: normalizedEmail,
        customer_phone: normalizedPhone,
        date: normalizedDate,
        time: normalizedTime,
        party_size: normalizedPartySize,
        type: normalizedType,
        status: "pending",
        notes,
        dietary_restrictions: normalizedDietaryRestrictions || null,
        event_notes: normalizedEventNotes || null,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("POST /api/reservations error:", err);
    res.status(500).json({ message: "Failed to create reservation." });
  }
});

router.patch("/:id", async (req, res) => {
  const reservationId = Number.parseInt(req.params.id, 10);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const normalizedDate = normalizeDateOnly(req.body?.date);
  const normalizedTime = normalizeTimeOnly(req.body?.time);
  const normalizedPartySize = Number.parseInt(req.body?.party_size, 10);

  if (!Number.isInteger(reservationId)) {
    return res.status(400).json({ message: "Reservation id is invalid." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (!normalizedDate || isPastDate(normalizedDate)) {
    return res.status(400).json({ message: "Choose a valid reservation date." });
  }

  if (!normalizedTime) {
    return res.status(400).json({ message: "Choose a valid reservation time slot." });
  }

  if (!Number.isInteger(normalizedPartySize) || normalizedPartySize < 1 || normalizedPartySize > 12) {
    return res.status(400).json({ message: "Party size must be between 1 and 12 guests." });
  }

  try {
    const reservation = await getReservationById(reservationId);

    if (!reservation || reservation.customer_email.toLowerCase() !== email) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    if (!canChangeReservation(reservation.date, reservation.time, reservation.status)) {
      return res.status(409).json({
        message: `Reservations can only be changed at least ${MODIFICATION_CUTOFF_HOURS} hours before the reservation time.`,
      });
    }

    const isAvailable = await validateAvailability({
      date: normalizedDate,
      time: normalizedTime,
      partySize: normalizedPartySize,
      excludeReservationId: reservationId,
    });

    if (!isAvailable) {
      return res.status(409).json({
        message: "That updated time slot is fully booked. Please choose another time.",
      });
    }

    await db.query(
      `UPDATE reservations
       SET date = ?, time = ?, party_size = ?
       WHERE id = ?`,
      [normalizedDate, normalizedTime, normalizedPartySize, reservationId]
    );

    const updatedReservation = await getReservationById(reservationId);

    res.json({
      message: "Reservation updated successfully.",
      reservation: mapReservationForResponse(updatedReservation),
    });
  } catch (err) {
    console.error("PATCH /api/reservations/:id error:", err);
    res.status(500).json({ message: "Failed to update reservation." });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  const reservationId = Number.parseInt(req.params.id, 10);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!Number.isInteger(reservationId)) {
    return res.status(400).json({ message: "Reservation id is invalid." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const reservation = await getReservationById(reservationId);

    if (!reservation || reservation.customer_email.toLowerCase() !== email) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    if (!canChangeReservation(reservation.date, reservation.time, reservation.status)) {
      return res.status(409).json({
        message: `Reservations can only be cancelled at least ${MODIFICATION_CUTOFF_HOURS} hours before the reservation time.`,
      });
    }

    await db.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
      [reservationId]
    );

    const cancelledReservation = await getReservationById(reservationId);

    res.json({
      message: "Reservation cancelled successfully.",
      reservation: mapReservationForResponse(cancelledReservation),
      confirmation_number: buildConfirmationNumber(cancelledReservation.id, cancelledReservation.date),
    });
  } catch (err) {
    console.error("PATCH /api/reservations/:id/cancel error:", err);
    res.status(500).json({ message: "Failed to cancel reservation." });
  }
});

router.patch("/:id/admin", adminGuard, async (req, res) => {
  const reservationId = Number.parseInt(req.params.id, 10);
  const normalizedDate = normalizeDateOnly(req.body?.date);
  const normalizedTime = normalizeTimeOnly(req.body?.time);
  const normalizedPartySize = Number.parseInt(req.body?.party_size, 10);
  const normalizedStatus = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";
  const normalizedType = typeof req.body?.type === "string" ? req.body.type.trim().toLowerCase() : "";

  if (!Number.isInteger(reservationId)) {
    return res.status(400).json({ message: "Reservation id is invalid." });
  }

  if (!normalizedDate || isPastDate(normalizedDate)) {
    return res.status(400).json({ message: "Choose a valid reservation date." });
  }

  if (!normalizedTime) {
    return res.status(400).json({ message: "Choose a valid reservation time slot." });
  }

  if (!Number.isInteger(normalizedPartySize) || normalizedPartySize < 1 || normalizedPartySize > 12) {
    return res.status(400).json({ message: "Party size must be between 1 and 12 guests." });
  }

  if (!ADMIN_STATUSES.has(normalizedStatus)) {
    return res.status(400).json({ message: "Choose a valid reservation status." });
  }

  if (!ALLOWED_TYPES.has(normalizedType)) {
    return res.status(400).json({ message: "Choose a valid dining option." });
  }

  try {
    const reservation = await getReservationById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    if (normalizedStatus !== "cancelled") {
      const isAvailable = await validateAvailability({
        date: normalizedDate,
        time: normalizedTime,
        partySize: normalizedPartySize,
        excludeReservationId: reservationId,
      });

      if (!isAvailable) {
        return res.status(409).json({
          message: "That reservation slot is fully booked. Please choose another time.",
        });
      }
    }

    const refreshedNotes = buildReservationNotes({
      type: normalizedType,
      dietaryRestrictions: reservation.dietary_restrictions || "",
      eventNotes: reservation.event_notes || "",
    });

    await db.query(
      `UPDATE reservations
       SET date = ?, time = ?, party_size = ?, type = ?, status = ?, notes = ?
       WHERE id = ?`,
      [normalizedDate, normalizedTime, normalizedPartySize, normalizedType, normalizedStatus, refreshedNotes, reservationId]
    );

    const updatedReservation = await getReservationById(reservationId);

    res.json({
      message: "Reservation updated successfully.",
      reservation: mapReservationForResponse(updatedReservation),
    });
  } catch (err) {
    console.error("PATCH /api/reservations/:id/admin error:", err);
    res.status(500).json({ message: "Failed to update reservation." });
  }
});

module.exports = router;
