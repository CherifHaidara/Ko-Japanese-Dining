-- Ko Japanese Dining
-- Menu Database Setup (Japanese Restaurant)
-- CMSC 447 - Software Engineering I - SP26

USE ko_dining;

-- Tables

CREATE TABLE IF NOT EXISTS menu_categories (
    category_id   INT           NOT NULL AUTO_INCREMENT,
    name          VARCHAR(50)   NOT NULL,
    description   TEXT,
    display_order INT           NOT NULL DEFAULT 0,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_category_name (name)
);

CREATE TABLE IF NOT EXISTS menu_sections (
    section_id    INT           NOT NULL AUTO_INCREMENT,
    category_id   INT           NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    description   TEXT,
    display_order INT           NOT NULL DEFAULT 0,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (section_id),
    CONSTRAINT fk_section_category
        FOREIGN KEY (category_id) REFERENCES menu_categories (category_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_items (
    item_id        INT            NOT NULL AUTO_INCREMENT,
    section_id     INT            NOT NULL,
    name           VARCHAR(150)   NOT NULL,
    description    TEXT,
    price          DECIMAL(6, 2)  NOT NULL,
    image_url      VARCHAR(255),
    is_available   BOOLEAN        NOT NULL DEFAULT TRUE,
    is_featured    BOOLEAN        NOT NULL DEFAULT FALSE,
    calories       INT,
    display_order  INT            NOT NULL DEFAULT 0,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id),
    CONSTRAINT fk_item_section
        FOREIGN KEY (section_id) REFERENCES menu_sections (section_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modifier_groups (
    group_id      INT           NOT NULL AUTO_INCREMENT,
    item_id       INT           NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    is_required   BOOLEAN       NOT NULL DEFAULT FALSE,
    max_select    INT           NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id),
    CONSTRAINT fk_modgroup_item
        FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modifier_options (
    option_id       INT            NOT NULL AUTO_INCREMENT,
    group_id        INT            NOT NULL,
    name            VARCHAR(100)   NOT NULL,
    additional_cost DECIMAL(5, 2)  NOT NULL DEFAULT 0.00,
    is_default      BOOLEAN        NOT NULL DEFAULT FALSE,
    display_order   INT            NOT NULL DEFAULT 0,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (option_id),
    CONSTRAINT fk_option_group
        FOREIGN KEY (group_id) REFERENCES modifier_groups (group_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    tag_id   INT          NOT NULL AUTO_INCREMENT,
    name     VARCHAR(50)  NOT NULL,
    icon     VARCHAR(10),
    PRIMARY KEY (tag_id),
    UNIQUE KEY uq_tag_name (name)
);

CREATE TABLE IF NOT EXISTS item_tags (
    item_id  INT NOT NULL,
    tag_id   INT NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    CONSTRAINT fk_itemtag_item FOREIGN KEY (item_id) REFERENCES menu_items (item_id) ON DELETE CASCADE,
    CONSTRAINT fk_itemtag_tag  FOREIGN KEY (tag_id)  REFERENCES tags (tag_id)        ON DELETE CASCADE
);

-- Seed data

INSERT INTO menu_categories (name, description, display_order) VALUES
    ('Japanese', 'Sushi, sashimi, ramen, and traditional Japanese cuisine', 1);

INSERT INTO menu_sections (category_id, name, display_order) VALUES
    (1, 'Appetizers',      1),
    (1, 'Sashimi',         2),
    (1, 'Sushi Rolls',     3),
    (1, 'Nigiri',          4),
    (1, 'Ramen & Noodles', 5),
    (1, 'Rice Dishes',     6);

SET @jp_appetizers = (SELECT section_id FROM menu_sections WHERE name = 'Appetizers');
SET @jp_sashimi    = (SELECT section_id FROM menu_sections WHERE name = 'Sashimi');
SET @jp_rolls      = (SELECT section_id FROM menu_sections WHERE name = 'Sushi Rolls');
SET @jp_nigiri     = (SELECT section_id FROM menu_sections WHERE name = 'Nigiri');
SET @jp_ramen      = (SELECT section_id FROM menu_sections WHERE name = 'Ramen & Noodles');
SET @jp_rice       = (SELECT section_id FROM menu_sections WHERE name = 'Rice Dishes');

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_appetizers, 'Edamame', 'Steamed salted soybeans', 5.00, FALSE, 1),
(@jp_appetizers, 'Gyoza (6 pcs)', 'Pan-fried pork and cabbage dumplings served with ponzu dipping sauce', 9.00, FALSE, 2),
(@jp_appetizers, 'Agedashi Tofu', 'Lightly battered silken tofu in a savory dashi broth, topped with green onion and bonito flakes', 9.50, FALSE, 3),
(@jp_appetizers, 'Takoyaki (6 pcs)', 'Octopus ball fritters topped with okonomiyaki sauce, mayo, and bonito flakes', 10.00, TRUE, 4),
(@jp_appetizers, 'Miso Soup', 'Traditional white miso broth with tofu, wakame, and green onion', 4.00, FALSE, 5);

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_sashimi, 'Salmon Sashimi (5 pcs)', 'Premium Atlantic salmon, sliced to order', 14.00, TRUE, 1),
(@jp_sashimi, 'Tuna Sashimi (5 pcs)', 'Bluefin tuna, restaurant-grade', 16.00, FALSE, 2),
(@jp_sashimi, 'Yellowtail Sashimi (5 pcs)', 'Hamachi with a delicate, buttery flavor', 15.00, FALSE, 3),
(@jp_sashimi, 'Sashimi Deluxe (15 pcs)', 'Chef selection of five varieties served with shredded daikon and wasabi', 38.00, TRUE, 4);

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_rolls, 'California Roll', 'Crab mix, avocado, cucumber wrapped in soy paper', 10.00, FALSE, 1),
(@jp_rolls, 'Spicy Tuna Roll', 'Tuna, spicy mayo, cucumber, topped with tobiko', 13.00, TRUE, 2),
(@jp_rolls, 'Dragon Roll', 'Shrimp tempura inside, avocado on top, drizzled with eel sauce', 15.00, TRUE, 3),
(@jp_rolls, 'Rainbow Roll', 'California roll topped with assorted sashimi and avocado', 16.00, FALSE, 4),
(@jp_rolls, 'Volcano Roll', 'Spicy crab baked with masago, topped with spicy mayo and eel sauce', 15.00, FALSE, 5),
(@jp_rolls, 'Ko Special Roll', 'Lobster tempura, cucumber, mango topped with seared salmon and yuzu ponzu', 19.00, TRUE, 6);

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_nigiri, 'Salmon Nigiri (2 pcs)',     'Hand-pressed sushi rice topped with salmon', 7.00, FALSE, 1),
(@jp_nigiri, 'Tuna Nigiri (2 pcs)',       'Hand-pressed sushi rice topped with bluefin tuna', 8.00, FALSE, 2),
(@jp_nigiri, 'Yellowtail Nigiri (2 pcs)', 'Hand-pressed sushi rice topped with hamachi', 8.00, FALSE, 3),
(@jp_nigiri, 'Eel Nigiri (2 pcs)',        'Grilled eel glazed with sweet eel sauce over rice', 9.00, FALSE, 4),
(@jp_nigiri, 'Scallop Nigiri (2 pcs)',    'Fresh bay scallop, lightly seared, over sushi rice', 9.00, TRUE, 5);

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_ramen, 'Tonkotsu Ramen', 'Rich pork bone broth, chashu pork, soft-boiled egg, nori, bamboo shoots', 17.00, TRUE, 1),
(@jp_ramen, 'Spicy Miso Ramen', 'Miso-based broth with chili oil, ground pork, corn, and green onion', 16.00, TRUE, 2),
(@jp_ramen, 'Shoyu Ramen', 'Soy sauce-based clear broth, chicken chashu, narutomaki, spinach', 15.00, FALSE, 3),
(@jp_ramen, 'Vegetable Ramen', 'Kombu dashi broth, tofu, shiitake mushrooms, bok choy, corn', 14.00, FALSE, 4),
(@jp_ramen, 'Yaki Udon', 'Thick udon noodles stir-fried with vegetables and choice of protein in savory tsuyu sauce', 14.00, FALSE, 5);

INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@jp_rice, 'Chicken Katsu Don', 'Panko-breaded chicken cutlet simmered in dashi and egg over steamed rice', 15.00, FALSE, 1),
(@jp_rice, 'Salmon Teriyaki Bowl', 'Grilled salmon glazed with house teriyaki sauce over steamed rice with pickled vegetables', 17.00, TRUE, 2),
(@jp_rice, 'Beef Gyudon', 'Thinly sliced beef and onion simmered in sweet soy broth over rice', 16.00, FALSE, 3);

INSERT INTO tags (name, icon) VALUES
    ('Vegetarian',    '🌿'),
    ('Vegan',         '🌱'),
    ('Gluten-Free',   '🌾'),
    ('Spicy',         '🌶️'),
    ('Contains Nuts', '🥜'),
    ('Shellfish',     '🦐'),
    ('Contains Egg',  '🥚'),
    ('Raw Fish',      '🐟'),
    ('Chefs Pick',    '⭐');

-- Views

CREATE OR REPLACE VIEW v_menu_full AS
SELECT
    mc.category_id,
    mc.name           AS category,
    ms.section_id,
    ms.name           AS section,
    mi.item_id,
    mi.name           AS item_name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.is_available,
    mi.is_featured,
    mi.calories,
    mi.display_order  AS item_order,
    ms.display_order  AS section_order,
    mc.display_order  AS category_order
FROM menu_categories  mc
JOIN menu_sections    ms ON ms.category_id = mc.category_id
JOIN menu_items       mi ON mi.section_id  = ms.section_id
WHERE mc.is_active = TRUE
  AND ms.is_active = TRUE
  AND mi.is_available = TRUE
ORDER BY mc.display_order, ms.display_order, mi.display_order;

CREATE OR REPLACE VIEW v_featured_items AS
SELECT * FROM v_menu_full
WHERE is_featured = TRUE;