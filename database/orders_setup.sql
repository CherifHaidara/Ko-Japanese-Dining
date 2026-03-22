-- Ko Japanese Dining
-- Orders table setup

USE ko_dining;

CREATE TABLE IF NOT EXISTS orders (
    order_id     INT           NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150),
    items        JSON          NOT NULL,
    total        DECIMAL(8,2)  NOT NULL,
    status       ENUM(
                   'pending',
                   'confirmed',
                   'preparing',
                   'ready',
                   'completed',
                   'cancelled'
                 ) NOT NULL DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id)
);

-- Seed a few test orders so the dashboard is not empty
INSERT INTO orders (customer_name, customer_email, items, total, status) VALUES
('Alice Chen',   'alice@example.com',  '[{"name":"Tonkotsu Ramen","price":17},{"name":"Edamame","price":5}]',  22.00, 'pending'),
('Marcus Lee',   'marcus@example.com', '[{"name":"Dragon Roll","price":15},{"name":"Miso Soup","price":4}]',   19.00, 'confirmed'),
('Sara Kim',     'sara@example.com',   '[{"name":"Sashimi Deluxe","price":38}]',                               38.00, 'ready');
