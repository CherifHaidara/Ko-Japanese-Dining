-- Ko Japanese Dining
-- Reservations Database Schema
-- CMSC 447 - Software Engineering I - SP26

USE ko_dining;

CREATE TABLE IF NOT EXISTS reservations (
    id                   INT            NOT NULL AUTO_INCREMENT,
    customer_id          INT,
    customer_name        VARCHAR(100)   NOT NULL,
    customer_email       VARCHAR(150)   NOT NULL,
    customer_phone       VARCHAR(30)    NOT NULL,
    date                 DATE           NOT NULL,
    time                 TIME           NOT NULL,
    party_size           INT            NOT NULL,
    type                 VARCHAR(30)    NOT NULL DEFAULT 'standard',
    status               VARCHAR(20)    NOT NULL DEFAULT 'pending',
    notes                TEXT,
    dietary_restrictions TEXT,
    event_notes          TEXT,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reservation_customer (customer_id),
    KEY idx_reservation_email (customer_email),
    KEY idx_reservation_datetime (date, time),
    KEY idx_reservation_status (status)
);
