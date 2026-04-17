-- Ko Japanese Dining
-- Menu Database Setup (Real Menu Data)
-- CMSC 447 - Software Engineering I - SP26

USE ko_dining;

-- ── Tables ──────────────────────────────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS menu_reviews (
    review_id   INT NOT NULL AUTO_INCREMENT,
    item_id     INT NOT NULL,
    user_id     INT NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (review_id),

    CONSTRAINT fk_review_item
        FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- ── Clear existing seed data ─────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE item_tags;
TRUNCATE TABLE modifier_options;
TRUNCATE TABLE modifier_groups;
TRUNCATE TABLE menu_items;
TRUNCATE TABLE menu_sections;
TRUNCATE TABLE menu_categories;
TRUNCATE TABLE tags;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Tags ─────────────────────────────────────────────────────────────────────
INSERT INTO tags (name, icon) VALUES
    ('Vegetarian',  NULL),
    ('Vegan',       NULL),
    ('Gluten-Free', NULL),
    ('Spicy',       NULL),
    ('Shellfish',   NULL),
    ('Contains Egg',NULL),
    ('Raw Fish',    NULL),
    ('Chef''s Pick',NULL);

-- ── Categories ───────────────────────────────────────────────────────────────
INSERT INTO menu_categories (name, description, display_order) VALUES
    ('Dinner', 'Full dinner service with starters, mains, sushi, sashimi, and more', 1),
    ('Lunch',  'Lunch service with lighter options and favorites',                    2),
    ('Brunch', 'Weekend brunch with Japanese-inspired dishes and bottomless mimosas', 3);

-- ─────────────────────────────────────────────────────────────────────────────
-- DINNER MENU
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO menu_sections (category_id, name, display_order) VALUES
    (1, 'Starters',    1),
    (1, 'Small Plates',2),
    (1, 'Main Course', 3),
    (1, 'Sashimi',     4),
    (1, 'Sushi',       5),
    (1, 'Kaiseki',     6),
    (1, 'Dessert',     7);

-- Dinner: Starters
SET @d_s = (SELECT section_id FROM menu_sections WHERE name = 'Starters' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_s, 'Edamame',                    'Steamed salted soybeans',                                                                                             6.00,  FALSE, 1),
(@d_s, 'Fried Eggplant Cheese',      'Fried eggplant topped with melted cheese',                                                                            9.00,  FALSE, 2),
(@d_s, 'Fried Cheese',               'Golden fried cheese sticks, crispy outside and gooey inside',                                                         8.00,  FALSE, 3),
(@d_s, 'Fried Tofu (Agedashi)',      'Lightly battered silken tofu in a savory dashi broth, topped with green onion and bonito flakes',                     9.00,  FALSE, 4),
(@d_s, 'Garlic Fries',               'Crispy fries tossed in garlic butter',                                                                                 8.00,  FALSE, 5),
(@d_s, 'Karaage (Fried Chicken)',    'Juicy bites of chicken, delicately marinated and fried, with a special refined dipping sauce',                        13.00, TRUE,  6),
(@d_s, 'Potato Croquettes',          'Golden-fried potato croquettes with a creamy center',                                                                  8.00,  FALSE, 7),
(@d_s, 'Mince Katsu (Beef)',         'Finely minced beef, breaded and fried to a golden hue, with a signature sauce',                                       10.00, FALSE, 8),
(@d_s, 'Sliced Tomato w/ Miso Sauce','Fresh sliced tomato served with savory miso sauce',                                                                    8.00,  FALSE, 9),
(@d_s, 'Omakase Salad',              'Chef''s selection salad with seasonal ingredients',                                                                   16.00, FALSE, 10),
(@d_s, 'Smash Cucumber',             'Lightly smashed cucumber with sesame and soy dressing',                                                                 6.00,  FALSE, 11),
(@d_s, 'Onigiri - Ume',              'Japanese rice ball with pickled plum filling',                                                                          5.00,  FALSE, 12),
(@d_s, 'Onigiri - Salmon',           'Japanese rice ball with seasoned salmon filling',                                                                       6.50,  FALSE, 13),
(@d_s, 'Onigiri - Tuna Mayo',        'Japanese rice ball with tuna mayo filling',                                                                             5.00,  FALSE, 14),
(@d_s, 'Onigiri - Pollock Roe',      'Japanese rice ball with seasoned pollock roe filling',                                                                  6.50,  FALSE, 15),
(@d_s, 'Ochazuke - Salmon',          'Steamed rice with salmon, soaked in hot green tea broth',                                                              8.00,  FALSE, 16),
(@d_s, 'Ochazuke - Ume',             'Steamed rice with pickled plum, soaked in hot green tea broth',                                                        6.50,  FALSE, 17),
(@d_s, 'Ochazuke - Pollock Roe',     'Steamed rice with pollock roe, soaked in hot green tea broth',                                                         9.50,  FALSE, 18),
(@d_s, 'Ochazuke - Wasabi',          'Steamed rice with wasabi, soaked in hot green tea broth',                                                              8.00,  FALSE, 19),
(@d_s, 'Yakitamago (Rolled Egg)',    'Japanese-style sweet rolled omelette',                                                                                 10.00, FALSE, 20),
(@d_s, 'Chawanmushi (Steamed Egg)',  'Savory silky steamed egg custard with seasonal toppings',                                                              10.00, FALSE, 21);

-- Dinner: Small Plates
SET @d_sp = (SELECT section_id FROM menu_sections WHERE name = 'Small Plates' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_sp, 'Yakisoba',                            'Stir-fried buckwheat noodles with vegetables and your choice of protein',          16.00, FALSE, 1),
(@d_sp, 'Yakiudon',                            'Stir-fried thick udon noodles with vegetables and your choice of protein',         16.00, FALSE, 2),
(@d_sp, 'Braised Pork Belly',                  'Slow-braised tender pork belly in a rich soy and mirin glaze',                     18.00, TRUE,  3),
(@d_sp, 'Aji Fry (Fried Fish)',                'Golden fried horse mackerel with tartar sauce',                                    13.00, FALSE, 4),
(@d_sp, 'Shiromi Fry (White Fish)',            'Crispy deep-fried white fish with tartar sauce',                                   12.00, FALSE, 5),
(@d_sp, 'Nimono (Chicken, Carrot, Cognac Stew)','Traditional Japanese simmered stew with chicken, carrot, and a hint of cognac',  15.00, FALSE, 6);

-- Dinner: Main Course
SET @d_m = (SELECT section_id FROM menu_sections WHERE name = 'Main Course' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_m, 'Karaage',          'Juicy bites of chicken, delicately marinated and fried. Served with a special refined dipping sauce, miso soup & rice',                    29.00, TRUE,  1),
(@d_m, 'Tonkatsu',         'Crispy breaded pork cutlet, deep-fried and served with savory Tonkatsu sauce and shredded cabbage. Served with miso soup & rice',           30.00, TRUE,  2),
(@d_m, 'Katsudon',         'Choice of chicken or pork cutlet, simmered in a sweet broth, topped with fluffy egg over steamed rice. Served with miso soup',             31.00, FALSE, 3),
(@d_m, 'Grilled Fish',     'Choice of White Fish, Mackerel, Blue Fish Mackerel, or Salmon. Served with miso soup & rice. Hokke +$3, Saba/Salmon +$2',                  32.00, FALSE, 4),
(@d_m, 'Chicken Teriyaki', 'Grilled chicken glazed with teriyaki sauce. Served with miso soup & rice',                                                                  29.00, TRUE,  5),
(@d_m, 'Mince Katsu',      'Finely minced ground beef, breaded and fried to a golden hue, with a signature sauce. Served with miso soup & rice',                       29.00, FALSE, 6),
(@d_m, 'Oyakodon',         'Tender chicken slices and beaten eggs simmered in a sweet broth, served over steamed rice with miso soup',                                  28.00, FALSE, 7),
(@d_m, 'Chicken Katsu',    'Panko-crusted chicken cutlet, deep-fried to golden brown, served with Tonkatsu sauce, miso soup & rice',                                    29.00, FALSE, 8),
(@d_m, 'Shogayaki',        'Sliced pork stir-fried with ginger-infused soy sauce. Served with miso soup & rice',                                                        29.00, FALSE, 9),
(@d_m, 'Yakiniku',         'Grilled slices of marinated beef, offering a blend of savory and smoky notes. Served with miso soup & rice',                                32.00, TRUE,  10),
(@d_m, 'Tempura Set',      'Curated selection of delicately battered shrimp and vegetables. Served with miso soup & rice',                                              32.00, FALSE, 11),
(@d_m, 'Tendon',           'Lightly battered shrimp and vegetables drizzled with savory soy-based sauce over a rice bowl. Served with miso soup',                      31.00, FALSE, 12),
(@d_m, 'Jumbo Fried Shrimp','Towering jumbo Japanese fried shrimp on a skewer. Served with tartar sauce and Bull Dog sauce',                                            42.00, TRUE,  13);

-- Dinner: Sashimi
SET @d_sa = (SELECT section_id FROM menu_sections WHERE name = 'Sashimi' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_sa, 'Sashimi Set A', 'Chef''s choice 9 pieces. Comes with rice & miso soup',  40.00, TRUE,  1),
(@d_sa, 'Sashimi Set B', 'Chef''s choice 14 pieces. Comes with rice & miso soup', 48.00, FALSE, 2);

-- Dinner: Sushi
SET @d_su = (SELECT section_id FROM menu_sections WHERE name = 'Sushi' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_su, 'Sushi Set A',         'Chef''s Choice 9pcs (7 Nigiri, California Roll, Tamago). Comes with California roll & miso soup. Extra wasabi +$1', 39.00, TRUE,  1),
(@d_su, 'Sushi Set B',         'Chef''s Choice 14pcs (12 Nigiri, California Roll, Tamago). Comes with California roll & miso soup. Extra wasabi +$1', 52.00, FALSE, 2),
(@d_su, 'California Roll',     'Crab mix, avocado, and cucumber — 6pcs. Extra wasabi +$1',                                                           10.00, FALSE, 3),
(@d_su, 'Spicy Tuna Roll',     'Spicy tuna with cucumber and sriracha mayo — 6pcs. Extra wasabi +$1',                                                13.00, TRUE,  4),
(@d_su, 'Spicy Salmon Roll',   'Spicy salmon with cucumber and sriracha mayo — 6pcs. Extra wasabi +$1',                                              13.00, FALSE, 5),
(@d_su, 'Salmon Roll',         'Fresh salmon roll — 6pcs. Extra wasabi +$1',                                                                         12.00, FALSE, 6),
(@d_su, 'Shrimp Tempura Roll', 'Crispy shrimp tempura roll — 6pcs. Extra wasabi +$1',                                                                14.00, FALSE, 7),
(@d_su, 'Premium Omakase',     'Chef''s choice of premium cuts of fish. Sushi and sashimi assortment. Starting from $130 — market price',           130.00, TRUE,  8);

-- Dinner: Kaiseki
SET @d_k = (SELECT section_id FROM menu_sections WHERE name = 'Kaiseki' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_k, 'Tempura Kaiseki Course',           'Traditional multi-course Japanese dinner featuring tempura. Reservation required. One course minimum per guest, full table ordering',                         110.00, FALSE, 1),
(@d_k, 'Sashimi & Tempura Kaiseki Course', 'Traditional multi-course Japanese dinner with sashimi and tempura. Reservation required. One course minimum per guest, full table ordering',                130.00, FALSE, 2),
(@d_k, 'Premium Kaiseki Course',           'Traditional multi-course Japanese dinner with sashimi, tempura, and wagyu. Reservation required. One course minimum per guest, full table ordering',       160.00, FALSE, 3);

-- Dinner: Dessert
SET @d_d = (SELECT section_id FROM menu_sections WHERE name = 'Dessert' AND category_id = 1);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@d_d, 'Matcha Affogato',         'Scoop of vanilla ice cream spiked in a warm splash of matcha',                                                           7.00,  TRUE,  1),
(@d_d, 'Mochi Ice Cream',         '3 pcs chewy mochi ice cream — choose from Strawberry, Green Tea, Vanilla, or Black Sesame',                              9.00,  TRUE,  2),
(@d_d, 'Basque Burnt Cheesecake', 'Creamy and velvety cheesecake — choose from Plain, Yuzu, Matcha, or Hojicha (+$1 for all besides plain)',                13.00, FALSE, 3),
(@d_d, 'Matcha Chiffon Cake',     'Spongy chiffon cake garnished with whipped cream, red bean paste, and powdered sugar',                                   14.00, FALSE, 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- LUNCH MENU
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO menu_sections (category_id, name, display_order) VALUES
    (2, 'Starters',    1),
    (2, 'Small Plates',2),
    (2, 'Main Course', 3),
    (2, 'Sushi',       4),
    (2, 'Dessert',     5);

-- Lunch: Starters
SET @l_s = (SELECT section_id FROM menu_sections WHERE name = 'Starters' AND category_id = 2);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@l_s, 'Edamame',                 'Steamed salted soybeans',                                                            6.00,  FALSE, 1),
(@l_s, 'Fried Tofu (Agedashi)',   'Lightly battered silken tofu in a savory dashi broth',                               9.00,  FALSE, 2),
(@l_s, 'Garlic Potato',           'Crispy potato with garlic butter',                                                    8.00,  FALSE, 3),
(@l_s, 'Karaage (Fried Chicken)', 'Juicy bites of chicken, delicately marinated and fried',                            11.00,  FALSE, 4),
(@l_s, 'Omakase Salad',           'Chef''s selection salad with seasonal ingredients',                                  14.00, FALSE, 5),
(@l_s, 'Yakitamago (Rolled Egg)', 'Japanese-style sweet rolled omelette',                                               9.00,  FALSE, 6);

-- Lunch: Small Plates
SET @l_sp = (SELECT section_id FROM menu_sections WHERE name = 'Small Plates' AND category_id = 2);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@l_sp, 'Yakisoba', 'Stir-fried buckwheat noodles with vegetables and your choice of protein', 14.00, FALSE, 1),
(@l_sp, 'Yakiudon', 'Stir-fried thick udon noodles with vegetables and your choice of protein',14.00, FALSE, 2);

-- Lunch: Main Course
SET @l_m = (SELECT section_id FROM menu_sections WHERE name = 'Main Course' AND category_id = 2);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@l_m, 'Karaage',               'Juicy bites of fried chicken with dipping sauce. Served with miso soup & rice',                  26.00, TRUE,  1),
(@l_m, 'Tonkatsu',              'Crispy breaded pork cutlet with Tonkatsu sauce. Served with miso soup & rice',                    26.00, TRUE,  2),
(@l_m, 'Katsudon',              'Chicken or pork cutlet simmered in sweet broth, topped with fluffy egg over steamed rice',        27.00, FALSE, 3),
(@l_m, 'Oyakodon',              'Tender chicken and beaten eggs simmered in sweet broth over steamed rice. With miso soup',        26.00, FALSE, 4),
(@l_m, 'Chicken Katsu',         'Panko-crusted chicken cutlet with Tonkatsu sauce. Served with miso soup & rice',                  26.00, FALSE, 5),
(@l_m, 'Karaage + Onigiri Set', 'Juicy bites of fried chicken served with rice balls',                                             26.00, FALSE, 6),
(@l_m, 'Tendon',                'Lightly battered shrimp and vegetables with savory soy-based sauce over rice. With miso soup',    28.00, FALSE, 7),
(@l_m, 'Yakiniku',              'Grilled slices of marinated beef. Served with miso soup & rice',                                  28.00, FALSE, 8),
(@l_m, 'Tempura Set',           'Curated selection of delicately battered shrimp and vegetables. With miso soup & rice',           29.00, FALSE, 9);

-- Lunch: Sushi
SET @l_su = (SELECT section_id FROM menu_sections WHERE name = 'Sushi' AND category_id = 2);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@l_su, 'Sushi Set A',         'Chef''s Choice 9pcs. Comes with California roll & miso soup. Extra wasabi +$1',  39.00, FALSE, 1),
(@l_su, 'Sushi Set B',         'Chef''s Choice 14pcs. Comes with California roll & miso soup. Extra wasabi +$1', 52.00, FALSE, 2),
(@l_su, 'California Roll',     'Crab mix, avocado, and cucumber — 6pcs',                                         10.00, FALSE, 3),
(@l_su, 'Spicy Tuna Roll',     'Spicy tuna with cucumber and sriracha mayo — 6pcs',                              13.00, FALSE, 4),
(@l_su, 'Spicy Salmon Roll',   'Spicy salmon with cucumber and sriracha mayo — 6pcs',                            13.00, FALSE, 5),
(@l_su, 'Salmon Roll',         'Fresh salmon roll — 6pcs',                                                        12.00, FALSE, 6),
(@l_su, 'Shrimp Tempura Roll', 'Crispy shrimp tempura roll — 6pcs',                                              14.00, FALSE, 7);

-- Lunch: Dessert
SET @l_d = (SELECT section_id FROM menu_sections WHERE name = 'Dessert' AND category_id = 2);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@l_d, 'Matcha Affogato',         'Scoop of vanilla ice cream spiked in a warm splash of matcha',                           7.00,  FALSE, 1),
(@l_d, 'Mochi Ice Cream',         '3 pcs chewy mochi ice cream — Strawberry, Green Tea, Vanilla, or Black Sesame',          9.00,  FALSE, 2),
(@l_d, 'Basque Burnt Cheesecake', 'Creamy cheesecake — Plain, Yuzu, Matcha, or Hojicha (+$1 for all besides plain)',        13.00, FALSE, 3),
(@l_d, 'Matcha Chiffon Cake',     'Spongy chiffon cake with whipped cream, red bean paste, and powdered sugar',             14.00, FALSE, 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- BRUNCH MENU
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO menu_sections (category_id, name, display_order) VALUES
    (3, 'Starters',     1),
    (3, 'Main Courses', 2),
    (3, 'Drinks',       3);

-- Brunch: Starters
SET @b_s = (SELECT section_id FROM menu_sections WHERE name = 'Starters' AND category_id = 3);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@b_s, 'Katsu Sando',  'Crispy breaded cutlet, chicken or pork, served between soft white bread with a tangy sauce',                                          15.00, TRUE,  1),
(@b_s, 'Tamago Sando', 'Rich, creamy Japanese-style egg filling served between soft white bread. A simple yet satisfying sandwich',                            15.00, FALSE, 2),
(@b_s, 'Okonomiyaki',  'Savory Japanese pancake made with cabbage and meat, topped with flavorful sauces, bonito flakes, and Kewpie mayo',                    15.00, TRUE,  3);

-- Brunch: Main Courses
SET @b_m = (SELECT section_id FROM menu_sections WHERE name = 'Main Courses' AND category_id = 3);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@b_m, 'Sabazkake',       'Grilled mackerel with crisp skin and tender meat, served with steamed rice, miso soup, pickles, and seasonal sides', 21.00, FALSE, 1),
(@b_m, 'Katsu Curry Rice','Japanese-style curry served with a crispy breaded cutlet — choose between chicken or pork',                           22.00, TRUE,  2);

-- Brunch: Drinks
SET @b_dr = (SELECT section_id FROM menu_sections WHERE name = 'Drinks' AND category_id = 3);
INSERT INTO menu_items (section_id, name, description, price, is_featured, display_order) VALUES
(@b_dr, 'Bottomless Mimosas', 'Add Bottomless Mimosas for 90 minutes. Choice of: Yuzu, Grape, Peach, or Classic Orange', 35.00, TRUE, 1);



-- CURRENTLY FILES DO EXIST BUT MENU DOESN'T DISPLAY THEM IN APP.JS
-- Updating for menu images 
UPDATE menu_items SET image_url = '/images/menu/edamame.png' WHERE name = 'Edamame';
UPDATE menu_items SET image_url = '/images/menu/fried-eggplant-cheese.png' WHERE name = 'Fried Eggplant Cheese';
UPDATE menu_items SET image_url = '/images/menu/fried-cheese.png' WHERE name = 'Fried Cheese';
UPDATE menu_items SET image_url = '/images/menu/fried-tofu-agedashi.png' WHERE name = 'Fried Tofu (Agedashi)';
UPDATE menu_items SET image_url = '/images/menu/garlic-fries.png' WHERE name = 'Garlic Fries';
UPDATE menu_items SET image_url = '/images/menu/karaage.png' WHERE name = 'Karaage (Fried Chicken)';
UPDATE menu_items SET image_url = '/images/menu/potato-croquettes.png' WHERE name = 'Potato Croquettes';
UPDATE menu_items SET image_url = '/images/menu/mince-katsu-beef.png' WHERE name = 'Mince Katsu (Beef)';
UPDATE menu_items SET image_url = '/images/menu/sliced-tomato-w-miso-sauce.png' WHERE name = 'Sliced Tomato w/ Miso Sauce';
UPDATE menu_items SET image_url = '/images/menu/omakase-salad.png' WHERE name = 'Omakase Salad';
UPDATE menu_items SET image_url = '/images/menu/smash-cucumber.png' WHERE name = 'Smash Cucumber';
UPDATE menu_items SET image_url = '/images/menu/onigiri-ume.png' WHERE name = 'Onigiri - Ume';
UPDATE menu_items SET image_url = '/images/menu/onigiri-salmon.png' WHERE name = 'Onigiri - Salmon';
UPDATE menu_items SET image_url = '/images/menu/onigiri-tuna-mayo.png' WHERE name = 'Onigiri - Tuna Mayo';
UPDATE menu_items SET image_url = '/images/menu/onigiri-pollock-roe.png' WHERE name = 'Onigiri - Pollock Roe';
UPDATE menu_items SET image_url = '/images/menu/ochazuke-salmon.png' WHERE name = 'Ochazuke - Salmon';
UPDATE menu_items SET image_url = '/images/menu/ochazuke-ume.png' WHERE name = 'Ochazuke - Ume';
UPDATE menu_items SET image_url = '/images/menu/ochazuke-pollock-roe.png' WHERE name = 'Ochazuke - Pollock Roe';
UPDATE menu_items SET image_url = '/images/menu/ochazuke-wasabi.png' WHERE name = 'Ochazuke - Wasabi';
UPDATE menu_items SET image_url = '/images/menu/yakitamago-rolled-egg.png' WHERE name = 'Yakitamago (Rolled Egg)';
UPDATE menu_items SET image_url = '/images/menu/chawanmushi-steamed-egg.png' WHERE name = 'Chawanmushi (Steamed Egg)';

UPDATE menu_items SET image_url = '/images/menu/yakisoba.png' WHERE name = 'Yakisoba';
UPDATE menu_items SET image_url = '/images/menu/yakiudon.png' WHERE name = 'Yakiudon';
UPDATE menu_items SET image_url = '/images/menu/braised-pork-belly.png' WHERE name = 'Braised Pork Belly';
UPDATE menu_items SET image_url = '/images/menu/aji-fry-fried-fish.png' WHERE name = 'Aji Fry (Fried Fish)';
UPDATE menu_items SET image_url = '/images/menu/shiromi-fry-white-fish.png' WHERE name = 'Shiromi Fry (White Fish)';
UPDATE menu_items SET image_url = '/images/menu/nimono-chicken-carrot-cognac-stew.png' WHERE name = 'Nimono (Chicken, Carrot, Cognac Stew)';

UPDATE menu_items SET image_url = '/images/menu/karaage.png' WHERE name = 'Karaage';
UPDATE menu_items SET image_url = '/images/menu/tonkatsu.png' WHERE name = 'Tonkatsu';
UPDATE menu_items SET image_url = '/images/menu/katsudon.png' WHERE name = 'Katsudon';
UPDATE menu_items SET image_url = '/images/menu/grilled-fish.png' WHERE name = 'Grilled Fish';
UPDATE menu_items SET image_url = '/images/menu/chicken-teriyaki.png' WHERE name = 'Chicken Teriyaki';
UPDATE menu_items SET image_url = '/images/menu/mince-katsu.png' WHERE name = 'Mince Katsu';
UPDATE menu_items SET image_url = '/images/menu/oyakodon.png' WHERE name = 'Oyakodon';
UPDATE menu_items SET image_url = '/images/menu/chicken-katsu.png' WHERE name = 'Chicken Katsu';
UPDATE menu_items SET image_url = '/images/menu/shogayaki.png' WHERE name = 'Shogayaki';
UPDATE menu_items SET image_url = '/images/menu/yakiniku.png' WHERE name = 'Yakiniku';
UPDATE menu_items SET image_url = '/images/menu/tempura-set.png' WHERE name = 'Tempura Set';
UPDATE menu_items SET image_url = '/images/menu/tendon.png' WHERE name = 'Tendon';
UPDATE menu_items SET image_url = '/images/menu/jumbo-fried-shrimp.png' WHERE name = 'Jumbo Fried Shrimp';

UPDATE menu_items SET image_url = '/images/menu/sashimi-set-a.png' WHERE name = 'Sashimi Set A';
UPDATE menu_items SET image_url = '/images/menu/sashimi-set-b.png' WHERE name = 'Sashimi Set B';

UPDATE menu_items SET image_url = '/images/menu/sushi-set-a.png' WHERE name = 'Sushi Set A';
UPDATE menu_items SET image_url = '/images/menu/sushi-set-b.png' WHERE name = 'Sushi Set B';
UPDATE menu_items SET image_url = '/images/menu/california-roll.png' WHERE name = 'California Roll';
UPDATE menu_items SET image_url = '/images/menu/spicy-tuna-roll.png' WHERE name = 'Spicy Tuna Roll';
UPDATE menu_items SET image_url = '/images/menu/spicy-salmon-roll.png' WHERE name = 'Spicy Salmon Roll';
UPDATE menu_items SET image_url = '/images/menu/salmon-roll.png' WHERE name = 'Salmon Roll';
UPDATE menu_items SET image_url = '/images/menu/shrimp-tempura-roll.png' WHERE name = 'Shrimp Tempura Roll';
UPDATE menu_items SET image_url = '/images/menu/premium-omakase.png' WHERE name = 'Premium Omakase';    

UPDATE menu_items SET image_url = '/images/menu/matcha-affogato.png' WHERE name = 'Matcha Affogato';
UPDATE menu_items SET image_url = '/images/menu/mochi-ice-cream.png' WHERE name = 'Mochi Ice Cream';
UPDATE menu_items SET image_url = '/images/menu/basque-burnt-cheesecake.png' WHERE name = 'Basque Burnt Cheesecake';
UPDATE menu_items SET image_url = '/images/menu/matcha-chiffon-cake.png' WHERE name = 'Matcha Chiffon Cake';

UPDATE menu_items SET image_url = '/images/menu/katsu-sando.png' WHERE name = 'Katsu Sando';
UPDATE menu_items SET image_url = '/images/menu/tamago-sando.png' WHERE name = 'Tamago Sando';
UPDATE menu_items SET image_url = '/images/menu/okonomiyaki.png' WHERE name = 'Okonomiyaki';

UPDATE menu_items SET image_url = '/images/menu/sabazkake.png' WHERE name = 'Sabazkake';
UPDATE menu_items SET image_url = '/images/menu/katsu-curry-rice.png' WHERE name = 'Katsu Curry Rice';

UPDATE menu_items SET image_url = '/images/menu/bottomless-mimosas.png' WHERE name = 'Bottomless Mimosas';