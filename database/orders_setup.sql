-- Ko Japanese Dining
-- Orders Database Schema
-- CMSC 447 - Software Engineering I - SP26

USE ko_dining;

-- ── Drop existing tables ────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    order_id       INT            NOT NULL AUTO_INCREMENT,
    customer_id    INT,
    customer_name  VARCHAR(100)   NOT NULL,
    customer_email VARCHAR(150),
    total          DECIMAL(8, 2)  NOT NULL,
    status         ENUM(
                     'pending',
                     'confirmed',
                     'preparing',
                     'ready',
                     'completed',
                     'cancelled'
                   )              NOT NULL DEFAULT 'pending',
    notes          TEXT,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    -- CONSTRAINT fk_order_customer
    --     FOREIGN KEY (customer_id) REFERENCES users (user_id)
    --     ON DELETE SET NULL
);

-- Stores each individual item within an order.
-- item_id is nullable so orders remain intact even if a menu item is later removed.
-- item_name and item_price are stored at the time of order to preserve order history.
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id  INT            NOT NULL AUTO_INCREMENT,
    order_id       INT            NOT NULL,
    item_id        INT,
    item_name      VARCHAR(150)   NOT NULL,
    item_price     DECIMAL(6, 2)  NOT NULL,
    quantity       INT            NOT NULL DEFAULT 1,
    modifiers      TEXT,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_item_id),
    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_item_menu
        FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        ON DELETE SET NULL
);

-- ── Seed Data ────────────────────────────────────────────────────────────────

INSERT INTO orders (customer_id, customer_name, customer_email, total, status) VALUES
    (1, 'Alice Chen',  'alice@example.com',  22.00, 'pending'),
    (2, 'Marcus Lee',  'marcus@example.com', 19.00, 'confirmed'),
    (3, 'Sara Kim',    'sara@example.com',   38.00, 'ready');

INSERT INTO order_items (order_id, item_name, item_price, quantity) VALUES
    (1, 'Tonkotsu Ramen', 17.00, 1),
    (1, 'Edamame',         5.00, 1),
    (2, 'California Roll', 10.00, 1),
    (2, 'Miso Soup',        4.00, 1),
    (2, 'Spicy Tuna Roll', 13.00, 1),    (3, 'Sashimi Set A',   40.00, 1);
