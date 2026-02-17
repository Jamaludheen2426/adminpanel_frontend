-- =============================================================================
-- Admin Panel - Initial Database Setup
-- MySQL: root / root
-- Run: mysql -u root -proot < initial_setup.sql
-- =============================================================================
-- is_active: 0 = inactive | 1 = active | 2 = pending (approval required)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS admin_dashboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE admin_dashboard;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(200) NOT NULL,
  `slug`       VARCHAR(200) NOT NULL UNIQUE,
  `domain`     VARCHAR(255) DEFAULT NULL,
  `logo`       VARCHAR(500) DEFAULT NULL,
  `email`      VARCHAR(255) DEFAULT NULL,
  `phone`      VARCHAR(20)  DEFAULT NULL,
  `address`    TEXT         DEFAULT NULL,
  `settings`   JSON         DEFAULT NULL,
  `max_users`  INT          DEFAULT NULL,
  `is_active`  TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by` INT          DEFAULT NULL,
  `updated_by` INT          DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `level`       INT          NOT NULL DEFAULT 0 COMMENT 'developer=1000,super_admin=100,admin=50,subadmin=25,custom=10',
  `company_id`  INT          DEFAULT NULL,
  `is_default`  TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `approved_at` DATETIME     DEFAULT NULL,
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_roles_company` (`company_id`),
  KEY `idx_roles_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id`                     INT          NOT NULL AUTO_INCREMENT,
  `full_name`              VARCHAR(200) NOT NULL,
  `email`                  VARCHAR(255) NOT NULL,
  `password`               VARCHAR(255) NOT NULL,
  `phone`                  VARCHAR(20)  DEFAULT NULL,
  `avatar`                 VARCHAR(500) DEFAULT NULL,
  `role_id`                INT          NOT NULL,
  `company_id`             INT          DEFAULT NULL,
  `username`               VARCHAR(100) DEFAULT NULL,
  `dob`                    DATE         DEFAULT NULL,
  `gender`                 ENUM('male','female','other') DEFAULT NULL,
  `marital_status`         ENUM('married','unmarried') DEFAULT NULL,
  `country_id`             INT          DEFAULT NULL,
  `state_id`               INT          DEFAULT NULL,
  `city_id`                INT          DEFAULT NULL,
  `pincode_id`             INT          DEFAULT NULL,
  `pincode`                VARCHAR(20)  DEFAULT NULL,
  `address`                TEXT         DEFAULT NULL,
  `department`             VARCHAR(200) DEFAULT NULL,
  `designation`            VARCHAR(200) DEFAULT NULL,
  `doj`                    DATE         DEFAULT NULL,
  `dor`                    DATE         DEFAULT NULL,
  `login_access`           TINYINT      NOT NULL DEFAULT 1,
  `email_verified_at`      DATETIME     DEFAULT NULL,
  `last_login_at`          DATETIME     DEFAULT NULL,
  `password_reset_token`   VARCHAR(255) DEFAULT NULL,
  `password_reset_expires` DATETIME     DEFAULT NULL,
  `is_active`              TINYINT      NOT NULL DEFAULT 0 COMMENT '0=inactive,1=active,2=pending',
  `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`             DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL UNIQUE,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT         DEFAULT NULL,
  `company_id`  INT          DEFAULT NULL,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `company_id`  INT          DEFAULT NULL,
  `module_id`   INT          DEFAULT NULL,
  `module`      VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_permissions_module` (`module`),
  KEY `idx_permissions_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id`                INT       NOT NULL AUTO_INCREMENT,
  `role_id`           INT       NOT NULL,
  `permission_id`     INT       NOT NULL,
  `company_id`        INT       DEFAULT NULL,
  `requires_approval` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`        DATETIME  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(100) NOT NULL UNIQUE,
  `value`       TEXT         DEFAULT NULL,
  `group`       VARCHAR(50)  NOT NULL DEFAULT 'general',
  `type`        ENUM('text','textarea','number','boolean','json','file') NOT NULL DEFAULT 'text',
  `description` TEXT         DEFAULT NULL,
  `company_id`  INT          DEFAULT NULL,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_settings_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Languages
CREATE TABLE IF NOT EXISTS `languages` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `code`        VARCHAR(10)  NOT NULL UNIQUE,
  `native_name` VARCHAR(100) DEFAULT NULL,
  `direction`   ENUM('ltr','rtl') NOT NULL DEFAULT 'ltr',
  `is_default`  TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Currencies
CREATE TABLE IF NOT EXISTS `currencies` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(100)  NOT NULL,
  `code`           VARCHAR(3)    NOT NULL UNIQUE,
  `symbol`         VARCHAR(10)   DEFAULT NULL,
  `exchange_rate`  DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  `decimal_places` INT           NOT NULL DEFAULT 2,
  `is_default`     TINYINT(1)    NOT NULL DEFAULT 0,
  `is_active`      TINYINT       NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`     INT           DEFAULT NULL,
  `updated_by`     INT           DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     DATETIME      DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Countries
CREATE TABLE IF NOT EXISTS `countries` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `code`          VARCHAR(3)   NOT NULL UNIQUE,
  `phone_code`    VARCHAR(10)  DEFAULT NULL,
  `currency_code` VARCHAR(3)   DEFAULT NULL,
  `flag`          VARCHAR(500) DEFAULT NULL,
  `is_active`     TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`    INT          DEFAULT NULL,
  `updated_by`    INT          DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- States
CREATE TABLE IF NOT EXISTS `states` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `country_id` INT          NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `code`       VARCHAR(10)  DEFAULT NULL,
  `is_active`  TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by` INT          DEFAULT NULL,
  `updated_by` INT          DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_states_country` (`country_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cities
CREATE TABLE IF NOT EXISTS `cities` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `state_id`  INT          NOT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `is_active` TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by` INT         DEFAULT NULL,
  `updated_by` INT         DEFAULT NULL,
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME    DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cities_state` (`state_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pincodes
CREATE TABLE IF NOT EXISTS `pincodes` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `city_id`    INT          NOT NULL,
  `pincode`    VARCHAR(20)  NOT NULL,
  `area_name`  VARCHAR(200) DEFAULT NULL,
  `is_active`  TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by` INT          DEFAULT NULL,
  `updated_by` INT          DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pincodes_city` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(500) NOT NULL UNIQUE,
  `user_id`    INT          NOT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `user_agent` TEXT         DEFAULT NULL,
  `expires_at` DATETIME     NOT NULL,
  `is_active`  TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_refresh_tokens_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `user_id`     INT          DEFAULT NULL,
  `action`      VARCHAR(50)  NOT NULL,
  `module`      VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `old_values`  JSON         DEFAULT NULL,
  `new_values`  JSON         DEFAULT NULL,
  `ip_address`  VARCHAR(45)  DEFAULT NULL,
  `user_agent`  TEXT         DEFAULT NULL,
  `url`         VARCHAR(500) DEFAULT NULL,
  `method`      VARCHAR(10)  DEFAULT NULL,
  `company_id`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Configs
CREATE TABLE IF NOT EXISTS `email_configs` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `from_email`  VARCHAR(255) NOT NULL,
  `from_name`   VARCHAR(100) DEFAULT NULL,
  `driver`      ENUM('smtp','brevo','elasticemail','sendmail') NOT NULL DEFAULT 'smtp',
  `host`        VARCHAR(255) DEFAULT NULL,
  `port`        INT          DEFAULT NULL,
  `username`    VARCHAR(255) DEFAULT NULL,
  `password`    VARCHAR(500) DEFAULT NULL,
  `encryption`  ENUM('tls','ssl','none') DEFAULT 'tls',
  `api_key`     VARCHAR(500) DEFAULT NULL,
  `domain`      VARCHAR(255) DEFAULT NULL,
  `region`      VARCHAR(100) DEFAULT NULL,
  `company_id`  INT          DEFAULT NULL,
  `is_default`  TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`  INT          DEFAULT NULL,
  `updated_by`  INT          DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Templates
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(100) NOT NULL,
  `slug`            VARCHAR(100) NOT NULL UNIQUE,
  `company_id`      INT          DEFAULT NULL,
  `type`            ENUM('header','footer','template') NOT NULL DEFAULT 'template',
  `subject`         VARCHAR(255) DEFAULT NULL,
  `body`            LONGTEXT     DEFAULT NULL,
  `variables`       JSON         DEFAULT NULL,
  `description`     VARCHAR(500) DEFAULT NULL,
  `header_id`       INT          DEFAULT NULL,
  `footer_id`       INT          DEFAULT NULL,
  `email_config_id` INT          DEFAULT NULL,
  `is_predefined`   TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`       TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`      INT          DEFAULT NULL,
  `updated_by`      INT          DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`      DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Campaigns
CREATE TABLE IF NOT EXISTS `email_campaigns` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100) NOT NULL,
  `slug`              VARCHAR(100) NOT NULL UNIQUE,
  `company_id`        INT          DEFAULT NULL,
  `description`       TEXT         DEFAULT NULL,
  `email_template_id` INT          NOT NULL,
  `email_config_id`   INT          DEFAULT NULL,
  `campaign_type`     ENUM('holiday','scheduled','recurring') NOT NULL,
  `holiday_name`      VARCHAR(100) DEFAULT NULL,
  `holiday_month`     INT          DEFAULT NULL,
  `holiday_day`       INT          DEFAULT NULL,
  `scheduled_date`    DATE         DEFAULT NULL,
  `scheduled_time`    TIME         DEFAULT NULL,
  `recurring_pattern` ENUM('daily','weekly','monthly','yearly') DEFAULT NULL,
  `recurring_day`     INT          DEFAULT NULL,
  `target_audience`   ENUM('all_users','active_users','verified_users','custom') NOT NULL DEFAULT 'all_users',
  `target_roles`      JSON         DEFAULT NULL,
  `variable_mappings` JSON         DEFAULT NULL,
  `total_recipients`  INT          NOT NULL DEFAULT 0,
  `total_sent`        INT          NOT NULL DEFAULT 0,
  `total_failed`      INT          NOT NULL DEFAULT 0,
  `last_run_at`       DATETIME     DEFAULT NULL,
  `next_run_at`       DATETIME     DEFAULT NULL,
  `is_active`         TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending (draft)',
  `created_by`        INT          DEFAULT NULL,
  `updated_by`        INT          DEFAULT NULL,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`        DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Queue
CREATE TABLE IF NOT EXISTS `email_queues` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `company_id`      INT          DEFAULT NULL,
  `campaign_id`     INT          NOT NULL,
  `user_id`         INT          NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `subject`         LONGTEXT     DEFAULT NULL,
  `body`            LONGTEXT     DEFAULT NULL,
  `priority`        INT          NOT NULL DEFAULT 5 COMMENT '1=highest,10=lowest',
  `attempts`        INT          NOT NULL DEFAULT 0,
  `max_attempts`    INT          NOT NULL DEFAULT 3,
  `last_error`      TEXT         DEFAULT NULL,
  `scheduled_at`    DATETIME     DEFAULT NULL,
  `processed_at`    DATETIME     DEFAULT NULL,
  `sent_at`         DATETIME     DEFAULT NULL,
  `email_config_id` INT          DEFAULT NULL,
  `is_active`       TINYINT      NOT NULL DEFAULT 1 COMMENT '0=failed,1=pending/sent,2=processing',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_eq_priority` (`priority`, `scheduled_at`),
  KEY `idx_eq_campaign_user` (`campaign_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Sent Logs
CREATE TABLE IF NOT EXISTS `email_sent_logs` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `company_id`      INT          DEFAULT NULL,
  `campaign_id`     INT          NOT NULL,
  `user_id`         INT          NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `subject`         VARCHAR(255) DEFAULT NULL,
  `sent_at`         DATETIME     DEFAULT NULL,
  `response`        TEXT         DEFAULT NULL,
  `email_config_id` INT          DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Translation Keys
CREATE TABLE IF NOT EXISTS `translation_keys` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `key`           VARCHAR(255) NOT NULL UNIQUE,
  `company_id`    INT          DEFAULT NULL,
  `default_value` TEXT         DEFAULT NULL,
  `description`   VARCHAR(500) DEFAULT NULL,
  `group`         VARCHAR(50)  NOT NULL DEFAULT 'common',
  `created_by`    INT          DEFAULT NULL,
  `updated_by`    INT          DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_translation_keys_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Translations
CREATE TABLE IF NOT EXISTS `translations` (
  `id`                 INT      NOT NULL AUTO_INCREMENT,
  `company_id`         INT      DEFAULT NULL,
  `translation_key_id` INT      NOT NULL,
  `language_id`        INT      NOT NULL,
  `value`              TEXT     DEFAULT NULL,
  `status`             ENUM('auto','reviewed') NOT NULL DEFAULT 'auto',
  `is_active`          TINYINT  NOT NULL DEFAULT 1 COMMENT '0=inactive,1=active,2=pending',
  `created_by`         INT      DEFAULT NULL,
  `updated_by`         INT      DEFAULT NULL,
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`         DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_translation_key_lang` (`translation_key_id`, `language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Missing Translation Keys
CREATE TABLE IF NOT EXISTS `missing_translation_keys` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `key`               VARCHAR(255) NOT NULL UNIQUE,
  `company_id`        INT          DEFAULT NULL,
  `default_value`     TEXT         DEFAULT NULL,
  `page_url`          VARCHAR(500) DEFAULT NULL,
  `report_count`      INT          NOT NULL DEFAULT 1,
  `first_reported_at` DATETIME     DEFAULT NULL,
  `last_reported_at`  DATETIME     DEFAULT NULL,
  `is_active`         TINYINT      NOT NULL DEFAULT 1 COMMENT '0=resolved/ignored,1=pending,2=in-progress',
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_missing_key` (`key`),
  KEY `idx_missing_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Requests
-- is_active: 0=rejected, 1=approved, 2=pending (awaiting super admin)
CREATE TABLE IF NOT EXISTS `approval_requests` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `company_id`      INT          DEFAULT NULL,
  `requester_id`    INT          NOT NULL,
  `approver_id`     INT          DEFAULT NULL,
  `module_slug`     VARCHAR(100) NOT NULL,
  `permission_slug` VARCHAR(100) NOT NULL,
  `action`          VARCHAR(50)  NOT NULL,
  `resource_type`   VARCHAR(50)  NOT NULL,
  `resource_id`     INT          DEFAULT NULL,
  `request_data`    JSON         DEFAULT NULL,
  `old_data`        JSON         DEFAULT NULL,
  `review_notes`    TEXT         DEFAULT NULL,
  `reviewed_at`     DATETIME     DEFAULT NULL,
  `is_active`       TINYINT      NOT NULL DEFAULT 2 COMMENT '0=rejected,1=approved,2=pending',
  `created_by`      INT          DEFAULT NULL,
  `updated_by`      INT          DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`      DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_approvals_active` (`is_active`),
  KEY `idx_approvals_requester` (`requester_id`),
  KEY `idx_approvals_module` (`module_slug`),
  KEY `idx_approvals_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Default Language
INSERT INTO `languages` (`name`, `code`, `native_name`, `direction`, `is_default`, `is_active`) VALUES
  ('English', 'en', 'English', 'ltr', 1, 1)
ON DUPLICATE KEY UPDATE `is_default` = 1;

-- Default Currency
INSERT INTO `currencies` (`name`, `code`, `symbol`, `exchange_rate`, `decimal_places`, `is_default`, `is_active`) VALUES
  ('US Dollar', 'USD', '$', 1.0000, 2, 1, 1)
ON DUPLICATE KEY UPDATE `is_default` = 1;

-- Default Settings
INSERT INTO `settings` (`key`, `value`, `group`, `type`, `description`, `company_id`, `is_active`) VALUES
  ('site_name',        'Admin Dashboard',      'general',    'text',    'Application name',        1, 1),
  ('site_email',       'admin@example.com',    'general',    'text',    'Site contact email',      1, 1),
  ('site_url',         'http://localhost:3000','general',    'text',    'Frontend URL',            1, 1),
  ('maintenance_mode', '0',                    'general',    'boolean', 'Maintenance mode toggle', 1, 1),
  ('allow_signup',     '1',                    'general',    'boolean', 'Allow new registrations', 1, 1),
  ('default_timezone', 'Asia/Kolkata',         'general',    'text',    'Default timezone',        1, 1),
  ('default_language', 'en',                   'general',    'text',    'Default language code',   1, 1),
  ('default_currency', 'USD',                  'general',    'text',    'Default currency code',   1, 1),
  ('items_per_page',   '25',                   'pagination', 'number',  'Default pagination size', 1, 1),
  ('max_file_size',    '10',                   'upload',     'number',  'Max upload size (MB)',    1, 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `company_id` = VALUES(`company_id`);

-- =============================================================================
-- DEFAULT COMPANY
-- =============================================================================

INSERT INTO `companies` (`id`, `name`, `slug`, `email`, `is_active`) VALUES
  (1, 'Default Company', 'default-company', 'admin@example.com', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `is_active` = 1;

-- =============================================================================
-- ROLES
-- =============================================================================

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `level`, `company_id`, `is_default`, `is_active`) VALUES
  (1, 'Developer',   'developer',   'Full system access across all companies. Bypasses all checks.', 1000, NULL, 0, 1),
  (2, 'Super Admin', 'super_admin', 'Full administrative access. Approves pending requests.',         100,  1,    0, 1),
  (3, 'Admin',       'admin',       'Standard administrative access.',                               50,   1,    1, 1)
ON DUPLICATE KEY UPDATE `level` = VALUES(`level`), `company_id` = VALUES(`company_id`), `is_active` = 1;

-- =============================================================================
-- MODULES
-- =============================================================================

INSERT INTO `modules` (`name`, `slug`, `description`, `company_id`, `is_active`) VALUES
  ('Employees',       'employees',       'User/employee management',              1, 1),
  ('Roles',           'roles',           'Role management',                       1, 1),
  ('Permissions',     'permissions',     'Permission management',                 1, 1),
  ('Modules',         'modules',         'Module management',                     1, 1),
  ('Settings',        'settings',        'Application settings',                  1, 1),
  ('Locations',       'locations',       'Country, state, city management',       1, 1),
  ('Languages',       'languages',       'Language management',                   1, 1),
  ('Currencies',      'currencies',      'Currency management',                   1, 1),
  ('Media',           'media',           'File upload and management',            1, 1),
  ('Translations',    'translations',    'Translation key management',            1, 1),
  ('Email Configs',   'email_configs',   'Email provider configuration',          1, 1),
  ('Email Templates', 'email_templates', 'Email template management',             1, 1),
  ('Email Campaigns', 'email_campaigns', 'Email campaign management',             1, 1),
  ('Activity Logs',   'activity_logs',   'User activity audit logs',              1, 1),
  ('Approvals',       'approvals',       'Approval workflow management',          1, 1),
  ('Companies',       'companies',       'Company management (developer only)',   1, 1),
  ('Pages',           'pages',           'Static page management',                1, 1),
  ('Blog',            'blog',            'Blog post management',                  1, 1),
  ('Testimonials',    'testimonials',    'Testimonial management',                1, 1),
  ('Ads',             'ads',             'Advertisement management',              1, 1),
  ('Announcements',   'announcements',   'Announcement management',               1, 1),
  ('FAQs',            'faqs',            'FAQ management',                        1, 1),
  ('Newsletters',     'newsletters',     'Newsletter management',                 1, 1),
  ('Contact',         'contact',         'Contact message management',            1, 1),
  ('Plugins',         'plugins',         'Plugin management',                     1, 1),
  ('Tools',           'tools',           'Admin tools',                           1, 1),
  ('Appearance',      'appearance',      'Theme and appearance settings',         1, 1),
  ('Platform',        'platform',        'Platform administration',               1, 1)
ON DUPLICATE KEY UPDATE `is_active` = 1, `company_id` = VALUES(`company_id`);

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

INSERT INTO `permissions` (`name`, `slug`, `module`, `company_id`, `description`, `is_active`) VALUES
  -- Employees
  ('View Employees',   'employees.view',   'employees', 1, 'View employee list and details', 1),
  ('Create Employee',  'employees.create', 'employees', 1, 'Create new employees',           1),
  ('Edit Employee',    'employees.edit',   'employees', 1, 'Edit employee information',       1),
  ('Delete Employee',  'employees.delete', 'employees', 1, 'Delete employees',               1),
  -- Roles
  ('View Roles',   'roles.view',   'roles', 1, 'View roles list',               1),
  ('Manage Roles', 'roles.manage', 'roles', 1, 'Create, edit and delete roles', 1),
  -- Permissions
  ('View Permissions',   'permissions.view',   'permissions', 1, 'View permissions list',         1),
  ('Manage Permissions', 'permissions.manage', 'permissions', 1, 'Create and edit permissions',   1),
  -- Modules
  ('View Modules',   'modules.view',   'modules', 1, 'View modules list',         1),
  ('Manage Modules', 'modules.manage', 'modules', 1, 'Create and edit modules',   1),
  -- Settings
  ('View Settings', 'settings.view', 'settings', 1, 'View application settings',   1),
  ('Edit Settings', 'settings.edit', 'settings', 1, 'Modify application settings', 1),
  -- Locations
  ('View Locations',   'locations.view',   'locations', 1, 'View countries, states, cities',  1),
  ('Manage Locations', 'locations.manage', 'locations', 1, 'Manage countries, states, cities', 1),
  -- Languages
  ('View Languages',   'languages.view',   'languages', 1, 'View languages list', 1),
  ('Create Language',  'languages.create', 'languages', 1, 'Add new languages',   1),
  ('Edit Language',    'languages.edit',   'languages', 1, 'Edit languages',      1),
  ('Delete Language',  'languages.delete', 'languages', 1, 'Delete languages',    1),
  -- Currencies
  ('View Currencies',  'currencies.view',   'currencies', 1, 'View currencies list', 1),
  ('Create Currency',  'currencies.create', 'currencies', 1, 'Add new currencies',  1),
  ('Edit Currency',    'currencies.edit',   'currencies', 1, 'Edit currencies',     1),
  ('Delete Currency',  'currencies.delete', 'currencies', 1, 'Delete currencies',   1),
  -- Media
  ('View Media',   'media.view',   'media', 1, 'View media library',   1),
  ('Upload Media', 'media.upload', 'media', 1, 'Upload files',         1),
  ('Delete Media', 'media.delete', 'media', 1, 'Delete uploaded files', 1),
  -- Translations
  ('View Translations',   'translations.view',   'translations', 1, 'View translation keys',       1),
  ('Create Translation',  'translations.create', 'translations', 1, 'Create translation keys',     1),
  ('Edit Translation',    'translations.edit',   'translations', 1, 'Edit translations',           1),
  ('Delete Translation',  'translations.delete', 'translations', 1, 'Delete translation keys',     1),
  ('Manage Translations', 'translations.manage', 'translations', 1, 'Manage translation settings', 1),
  -- Email Configs
  ('View Email Configs',   'email_configs.view',   'email_configs', 1, 'View email configurations',    1),
  ('Create Email Config',  'email_configs.create', 'email_configs', 1, 'Create email configs',         1),
  ('Edit Email Config',    'email_configs.edit',   'email_configs', 1, 'Edit email configurations',    1),
  ('Delete Email Config',  'email_configs.delete', 'email_configs', 1, 'Delete email configs',         1),
  ('Manage Email Configs', 'email_configs.manage', 'email_configs', 1, 'Manage email config settings', 1),
  -- Email Templates
  ('Read Email Templates',   'email_templates.read',   'email_templates', 1, 'View email templates',   1),
  ('Create Email Template',  'email_templates.create', 'email_templates', 1, 'Create email templates', 1),
  ('Update Email Template',  'email_templates.update', 'email_templates', 1, 'Update email templates', 1),
  ('Delete Email Template',  'email_templates.delete', 'email_templates', 1, 'Delete email templates', 1),
  ('Manage Email Templates', 'email_templates.manage', 'email_templates', 1, 'Manage email templates', 1),
  -- Email Campaigns
  ('Read Email Campaigns',   'email_campaigns.read',   'email_campaigns', 1, 'View email campaigns',    1),
  ('Create Email Campaign',  'email_campaigns.create', 'email_campaigns', 1, 'Create email campaigns',  1),
  ('Update Email Campaign',  'email_campaigns.update', 'email_campaigns', 1, 'Update email campaigns',  1),
  ('Delete Email Campaign',  'email_campaigns.delete', 'email_campaigns', 1, 'Delete email campaigns',  1),
  ('Manage Email Campaigns', 'email_campaigns.manage', 'email_campaigns', 1, 'Manage campaign actions', 1),
  -- Activity Logs
  ('View Activity Logs',   'activity_logs.view',   'activity_logs', 1, 'View activity logs', 1),
  ('Delete Activity Logs', 'activity_logs.delete', 'activity_logs', 1, 'Clear activity logs', 1),
  -- Pages
  ('View Pages',   'pages.view',   'pages', 1, 'View pages list', 1),
  ('Create Page',  'pages.create', 'pages', 1, 'Create pages',    1),
  ('Edit Page',    'pages.edit',   'pages', 1, 'Edit pages',      1),
  ('Delete Page',  'pages.delete', 'pages', 1, 'Delete pages',    1),
  -- Blog
  ('View Blog',   'blog.view',   'blog', 1, 'View blog posts', 1),
  ('Create Blog', 'blog.create', 'blog', 1, 'Create blog posts', 1),
  ('Edit Blog',   'blog.edit',   'blog', 1, 'Edit blog posts',   1),
  ('Delete Blog', 'blog.delete', 'blog', 1, 'Delete blog posts', 1),
  -- Testimonials
  ('View Testimonials',   'testimonials.view',   'testimonials', 1, 'View testimonials', 1),
  ('Create Testimonial',  'testimonials.create', 'testimonials', 1, 'Create testimonials', 1),
  ('Edit Testimonial',    'testimonials.edit',   'testimonials', 1, 'Edit testimonials',   1),
  ('Delete Testimonial',  'testimonials.delete', 'testimonials', 1, 'Delete testimonials', 1),
  -- Ads
  ('View Ads',   'ads.view',   'ads', 1, 'View ads', 1),
  ('Create Ad',  'ads.create', 'ads', 1, 'Create ads', 1),
  ('Edit Ad',    'ads.edit',   'ads', 1, 'Edit ads',   1),
  ('Delete Ad',  'ads.delete', 'ads', 1, 'Delete ads', 1),
  -- Announcements
  ('View Announcements',   'announcements.view',   'announcements', 1, 'View announcements', 1),
  ('Create Announcement',  'announcements.create', 'announcements', 1, 'Create announcements', 1),
  ('Edit Announcement',    'announcements.edit',   'announcements', 1, 'Edit announcements',   1),
  ('Delete Announcement',  'announcements.delete', 'announcements', 1, 'Delete announcements', 1),
  -- FAQs
  ('View FAQs',   'faqs.view',   'faqs', 1, 'View FAQs', 1),
  ('Create FAQ',  'faqs.create', 'faqs', 1, 'Create FAQs', 1),
  ('Edit FAQ',    'faqs.edit',   'faqs', 1, 'Edit FAQs',   1),
  ('Delete FAQ',  'faqs.delete', 'faqs', 1, 'Delete FAQs', 1),
  -- Newsletters
  ('View Newsletters',   'newsletters.view',   'newsletters', 1, 'View newsletters', 1),
  ('Create Newsletter',  'newsletters.create', 'newsletters', 1, 'Create newsletters', 1),
  ('Edit Newsletter',    'newsletters.edit',   'newsletters', 1, 'Edit newsletters',   1),
  ('Delete Newsletter',  'newsletters.delete', 'newsletters', 1, 'Delete newsletters', 1),
  -- Contact
  ('View Contact',   'contact.view',   'contact', 1, 'View contact messages', 1),
  ('Delete Contact', 'contact.delete', 'contact', 1, 'Delete contact messages', 1),
  -- Plugins
  ('View Plugins',   'plugins.view',   'plugins', 1, 'View plugins', 1),
  ('Manage Plugins', 'plugins.manage', 'plugins', 1, 'Manage plugins', 1),
  -- Tools
  ('View Tools',   'tools.view',   'tools', 1, 'View admin tools', 1),
  ('Manage Tools', 'tools.manage', 'tools', 1, 'Use admin tools',  1),
  -- Appearance
  ('View Appearance',   'appearance.view',   'appearance', 1, 'View appearance settings', 1),
  ('Manage Appearance', 'appearance.manage', 'appearance', 1, 'Manage theme and menus',   1),
  -- Platform
  ('View Platform',   'platform.view',   'platform', 1, 'View platform settings', 1),
  ('Manage Platform', 'platform.manage', 'platform', 1, 'Manage platform settings', 1)
ON DUPLICATE KEY UPDATE `is_active` = 1, `company_id` = VALUES(`company_id`);

-- =============================================================================
-- USERS
-- Password: 123456 → bcrypt hash (12 rounds, generated with bcryptjs)
-- =============================================================================

SET @pwd = '$2a$12$j9/C4.w7PU71prZwuN0hGOrCBnfxdYZgp.SDidsR3rPWY1zJc3ddq';

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role_id`, `company_id`, `username`, `login_access`, `email_verified_at`, `is_active`) VALUES
  (1, 'Developer',   'developer@admin.com',  @pwd, 1, NULL, 'developer',  1, NOW(), 1),
  (2, 'Super Admin', 'superadmin@admin.com', @pwd, 2, 1,    'superadmin', 1, NOW(), 1),
  (3, 'Admin',       'admin@admin.com',      @pwd, 3, 1,    'admin',      1, NOW(), 1)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `is_active` = 1, `company_id` = VALUES(`company_id`), `email_verified_at` = NOW();

-- Back-fill created_by on roles
SET SQL_SAFE_UPDATES = 0;
UPDATE `roles` SET `created_by` = 1 WHERE `created_by` IS NULL;

-- Link permissions to their modules via module_id
UPDATE `permissions` p
JOIN `modules` m ON m.`slug` = p.`module`
SET p.`module_id` = m.`id`
WHERE p.`module_id` IS NULL;

SET SQL_SAFE_UPDATES = 1;

-- =============================================================================
-- ROLE PERMISSIONS  (assign all permissions to Admin; Developer & Super Admin
-- bypass checks via level >= 100, so no rows needed for them)
-- =============================================================================

INSERT INTO `role_permissions` (`role_id`, `permission_id`, `company_id`, `requires_approval`)
SELECT 3, `id`, 1, 0 FROM `permissions` WHERE `company_id` = 1
ON DUPLICATE KEY UPDATE `requires_approval` = 0, `company_id` = 1;

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role`    FOREIGN KEY (`role_id`)    REFERENCES `roles`     (`id`),
  ADD CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_rp_role`       FOREIGN KEY (`role_id`)       REFERENCES `roles`       (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

ALTER TABLE `permissions`
  ADD CONSTRAINT `fk_permissions_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL;

ALTER TABLE `states`
  ADD CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE;

ALTER TABLE `cities`
  ADD CONSTRAINT `fk_cities_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE;

ALTER TABLE `pincodes`
  ADD CONSTRAINT `fk_pincodes_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE;

ALTER TABLE `translations`
  ADD CONSTRAINT `fk_translations_key`  FOREIGN KEY (`translation_key_id`) REFERENCES `translation_keys` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_translations_lang` FOREIGN KEY (`language_id`)        REFERENCES `languages`        (`id`) ON DELETE CASCADE;

ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- =============================================================================
-- TRANSLATION KEYS + ENGLISH TRANSLATIONS
-- =============================================================================

INSERT INTO `translation_keys` (`key`, `default_value`, `group`, `company_id`) VALUES
  -- nav
  ('nav.navigation',    'Navigation',      'nav', 1),
  ('nav.dashboard',     'Dashboard',       'nav', 1),
  ('nav.companies',     'Companies',       'nav', 1),
  ('nav.approvals',     'Approvals',       'nav', 1),
  ('nav.employees',     'Employees',       'nav', 1),
  ('nav.pages',         'Pages',           'nav', 1),
  ('nav.blog',          'Blog',            'nav', 1),
  ('nav.testimonials',  'Testimonials',    'nav', 1),
  ('nav.ads',           'Ads',             'nav', 1),
  ('nav.announcements', 'Announcements',   'nav', 1),
  ('nav.faqs',          'FAQs',            'nav', 1),
  ('nav.faq_list',      'FAQ List',        'nav', 1),
  ('nav.faq_categories','FAQ Categories',  'nav', 1),
  ('nav.locations',     'Locations',       'nav', 1),
  ('nav.newsletters',   'Newsletters',     'nav', 1),
  ('nav.contact',       'Contact',         'nav', 1),
  ('nav.media',         'Media',           'nav', 1),
  ('nav.plugins',       'Plugins',         'nav', 1),
  ('nav.tools',         'Tools',           'nav', 1),
  ('nav.access_control','Access Control',  'nav', 1),
  ('nav.roles',         'Roles',           'nav', 1),
  ('nav.modules',       'Modules',         'nav', 1),
  ('nav.appearance',    'Appearance',      'nav', 1),
  ('nav.theme',         'Theme',           'nav', 1),
  ('nav.menu',          'Menu',            'nav', 1),
  ('nav.theme_option',  'Theme Options',   'nav', 1),
  ('nav.settings',      'Settings',        'nav', 1),
  ('nav.platform_admin','Platform Admin',  'nav', 1),
  ('nav.profile',       'Profile',         'nav', 1),
  ('nav.translations',  'Translations',    'nav', 1),
  -- common
  ('common.name',         'Name',          'common', 1),
  ('common.description',  'Description',   'common', 1),
  ('common.status',       'Status',        'common', 1),
  ('common.actions',      'Actions',       'common', 1),
  ('common.action',       'Action',        'common', 1),
  ('common.active',       'Active',        'common', 1),
  ('common.inactive',     'Inactive',      'common', 1),
  ('common.approved',     'Approved',      'common', 1),
  ('common.create',       'Create',        'common', 1),
  ('common.edit',         'Edit',          'common', 1),
  ('common.delete',       'Delete',        'common', 1),
  ('common.save',         'Save',          'common', 1),
  ('common.saving',       'Saving...',     'common', 1),
  ('common.cancel',       'Cancel',        'common', 1),
  ('common.submit',       'Submit',        'common', 1),
  ('common.loading',      'Loading...',    'common', 1),
  ('common.deleting',     'Deleting...',   'common', 1),
  ('common.changing',     'Changing...',   'common', 1),
  ('common.code',         'Code',          'common', 1),
  ('common.email',        'Email',         'common', 1),
  ('common.user',         'User',          'common', 1),
  ('common.date',         'Date',          'common', 1),
  ('common.page',         'Page',          'common', 1),
  ('common.next',         'Next',          'common', 1),
  ('common.previous',     'Previous',      'common', 1),
  ('common.optional',     'Optional',      'common', 1),
  -- settings
  ('settings.page_desc',          'Manage your application settings',       'settings', 1),
  ('settings.general',            'General',                                 'settings', 1),
  ('settings.general_desc',       'Basic site configuration',               'settings', 1),
  ('settings.email',              'Email',                                   'settings', 1),
  ('settings.email_desc',         'Email provider settings',                'settings', 1),
  ('settings.email_templates',    'Email Templates',                        'settings', 1),
  ('settings.email_templates_desc','Manage email templates',                'settings', 1),
  ('settings.email_campaigns',    'Email Campaigns',                        'settings', 1),
  ('settings.email_campaigns_desc','Manage email campaigns',                'settings', 1),
  ('settings.languages',          'Languages',                              'settings', 1),
  ('settings.languages_desc',     'Manage supported languages',             'settings', 1),
  ('settings.currencies',         'Currencies',                             'settings', 1),
  ('settings.currencies_desc',    'Manage supported currencies',            'settings', 1),
  ('settings.media',              'Media',                                   'settings', 1),
  ('settings.media_desc',         'File upload settings',                   'settings', 1),
  ('settings.translations',       'Translations',                           'settings', 1),
  ('settings.translations_desc',  'Manage translation keys',                'settings', 1),
  ('settings.locations',          'Locations',                              'settings', 1),
  ('settings.locations_desc',     'Manage countries, states and cities',    'settings', 1),
  ('settings.timezone',           'Timezone',                               'settings', 1),
  ('settings.timezone_desc',      'Configure application timezone',         'settings', 1),
  ('settings.site_settings',      'Site Settings',                          'settings', 1),
  ('settings.site_settings_desc', 'Configure site-wide settings',           'settings', 1),
  ('settings.social_login',       'Social Login',                           'settings', 1),
  ('settings.social_login_desc',  'Configure social authentication',        'settings', 1),
  ('settings.website_tracking',   'Website Tracking',                       'settings', 1),
  ('settings.website_tracking_desc','Configure analytics tracking',         'settings', 1),
  ('settings.dashboard_theme',    'Dashboard Theme',                        'settings', 1),
  ('settings.dashboard_theme_desc','Customize dashboard appearance',        'settings', 1),
  ('settings.phone_number',       'Phone Number',                           'settings', 1),
  ('settings.phone_number_desc',  'Configure phone number settings',        'settings', 1),
  -- common.comming (shown in screenshot)
  ('common.comming',              'Coming Soon',                            'common', 1),
  -- dashboard
  ('dashboard.welcome_admin', 'Welcome back, Admin', 'dashboard', 1),
  ('dashboard.quick_actions', 'Quick Actions',       'dashboard', 1),
  -- auth
  ('auth.greeting',     'Hello',           'auth', 1),
  ('auth.welcome',      'Welcome',         'auth', 1),
  ('auth.welcome_back', 'Welcome Back',    'auth', 1),
  ('auth.logout',       'Logout',          'auth', 1),
  -- profile
  ('profile.title',               'Profile',                   'profile', 1),
  ('profile.description',         'Manage your account',       'profile', 1),
  ('profile.my_account',          'My Account',                'profile', 1),
  ('profile.account_details',     'Account Details',           'profile', 1),
  ('profile.account_info',        'Account Info',              'profile', 1),
  ('profile.personal_info',       'Personal Information',      'profile', 1),
  ('profile.personal_info_desc',  'Update your personal info', 'profile', 1),
  ('profile.full_name',           'Full Name',                 'profile', 1),
  ('profile.phone',               'Phone',                     'profile', 1),
  ('profile.last_login',          'Last Login',                'profile', 1),
  ('profile.update_profile',      'Update Profile',            'profile', 1),
  ('profile.change_password',     'Change Password',           'profile', 1),
  ('profile.change_password_desc','Update your password',      'profile', 1),
  ('profile.current_password',    'Current Password',          'profile', 1),
  ('profile.new_password',        'New Password',              'profile', 1),
  ('profile.confirm_new_password','Confirm New Password',      'profile', 1),
  ('profile.confirm_password',    'Confirm Password',          'profile', 1),
  ('profile.enter_current_password','Enter current password',  'profile', 1),
  ('profile.enter_new_password',  'Enter new password',        'profile', 1),
  -- roles
  ('roles.role',           'Role',              'roles', 1),
  ('roles.add_role',       'Add Role',          'roles', 1),
  ('roles.search',         'Search roles...',   'roles', 1),
  ('roles.no_roles_found', 'No roles found',    'roles', 1),
  -- languages
  ('languages.title',            'Languages',                   'languages', 1),
  ('languages.add_language',     'Add Language',                'languages', 1),
  ('languages.add_desc',         'Add a new language',          'languages', 1),
  ('languages.edit_language',    'Edit Language',               'languages', 1),
  ('languages.edit_desc',        'Update language details',     'languages', 1),
  ('languages.native_name',      'Native Name',                 'languages', 1),
  ('languages.direction',        'Direction',                   'languages', 1),
  ('languages.set_default',      'Set as Default',              'languages', 1),
  ('languages.search',           'Search languages...',         'languages', 1),
  ('languages.no_languages_found','No languages found',         'languages', 1),
  ('languages.delete_title',     'Delete Language',             'languages', 1),
  ('languages.translate_all',    'Translate All',               'languages', 1),
  ('languages.translate_all_title','Translate All Keys',        'languages', 1),
  ('languages.translating',      'Translating...',              'languages', 1),
  ('languages.translating_title','Translating',                 'languages', 1),
  ('languages.translating_to',   'Translating to',              'languages', 1),
  -- currencies
  ('currencies.title',              'Currencies',              'currencies', 1),
  ('currencies.add_currency',       'Add Currency',            'currencies', 1),
  ('currencies.add_desc',           'Add a new currency',      'currencies', 1),
  ('currencies.edit_currency',      'Edit Currency',           'currencies', 1),
  ('currencies.edit_desc',          'Update currency details', 'currencies', 1),
  ('currencies.symbol',             'Symbol',                  'currencies', 1),
  ('currencies.exchange_rate',      'Exchange Rate',           'currencies', 1),
  ('currencies.search',             'Search currencies...',    'currencies', 1),
  ('currencies.no_currencies_found','No currencies found',     'currencies', 1),
  ('currencies.delete_confirm',     'Confirm Delete',          'currencies', 1),
  -- translations
  ('translations.total_keys',          'Total Keys',                  'translations', 1),
  ('translations.completion_stats',    'Completion Stats',            'translations', 1),
  ('translations.missing_keys',        'Missing Keys',                'translations', 1),
  ('translations.missing_keys_desc',   'Keys detected but not translated', 'translations', 1),
  ('translations.missing_keys_detected','Missing keys detected',      'translations', 1),
  ('translations.add_key',             'Add Key',                     'translations', 1),
  ('translations.add_key_title',       'Add Translation Key',         'translations', 1),
  ('translations.add_key_desc',        'Create a new translation key','translations', 1),
  ('translations.edit_translations',   'Edit Translations',           'translations', 1),
  ('translations.key',                 'Key',                         'translations', 1),
  ('translations.group',               'Group',                       'translations', 1),
  ('translations.default_value',       'Default Value',               'translations', 1),
  ('translations.description_placeholder','Describe this key...',     'translations', 1),
  ('translations.key_format',          'Use dot notation: group.key', 'translations', 1),
  ('translations.languages',           'Languages',                   'translations', 1),
  ('translations.all_languages',       'All Languages',               'translations', 1),
  ('translations.all_groups',          'All Groups',                  'translations', 1),
  ('translations.all_status',          'All Status',                  'translations', 1),
  ('translations.filter_group',        'Filter by Group',             'translations', 1),
  ('translations.filter_language',     'Filter by Language',          'translations', 1),
  ('translations.filter_status',       'Filter by Status',            'translations', 1),
  ('translations.search_placeholder',  'Search keys...',              'translations', 1),
  ('translations.select_group',        'Select Group',                'translations', 1),
  ('translations.new_group',           'New Group',                   'translations', 1),
  ('translations.no_keys_found',       'No translation keys found',   'translations', 1),
  ('translations.no_keys_with_status', 'No keys with this status',    'translations', 1),
  ('translations.status_auto',         'Auto',                        'translations', 1),
  ('translations.status_reviewed',     'Reviewed',                    'translations', 1),
  ('translations.status_missing',      'Missing',                     'translations', 1),
  ('translations.auto_translate',      'Auto Translate',              'translations', 1),
  ('translations.retranslate',         'Re-translate',                'translations', 1),
  ('translations.english_default',     'English (Default)',           'translations', 1),
  ('translations.english_original',    'English Original',            'translations', 1),
  ('translations.translation_in',      'Translation in',              'translations', 1),
  ('translations.view_resolve',        'View & Resolve',              'translations', 1),
  -- activity
  ('activity.logs',        'Activity Logs',   'activity', 1),
  ('activity.logs_desc',   'User activity audit trail', 'activity', 1),
  ('activity.recent',      'Recent Activity', 'activity', 1),
  ('activity.no_activity', 'No activity yet', 'activity', 1),
  ('activity.view_all',    'View All',        'activity', 1),
  ('activity.date_time',   'Date & Time',     'activity', 1),
  ('activity.ip_address',  'IP Address',      'activity', 1),
  -- platform
  ('platform.page_desc',             'Manage platform settings',      'platform', 1),
  ('platform.system',                'System',                        'platform', 1),
  ('platform.employee_management',   'Employee Management',           'platform', 1),
  ('platform.employees_desc',        'Manage employees and users',    'platform', 1),
  ('platform.roles_desc',            'Manage roles and permissions',  'platform', 1),
  ('platform.modules_desc',          'Manage system modules',         'platform', 1),
  ('platform.activity_desc',         'View user activity logs',       'platform', 1),
  ('platform.cache_manager',         'Cache Manager',                 'platform', 1),
  ('platform.cache_desc',            'Manage application cache',      'platform', 1),
  ('platform.profile_desc',          'Manage your profile',           'platform', 1),
  -- nav (missing ones)
  ('nav.activity_logs',   'Activity Logs',    'nav', 1),
  ('nav.currencies',      'Currencies',       'nav', 1),
  ('nav.email_templates', 'Email Templates',  'nav', 1),
  ('nav.languages',       'Languages',        'nav', 1),
  ('nav.missing_keys',    'Missing Keys',     'nav', 1),
  ('nav.modules',         'Modules',          'nav', 1),
  ('nav.permissions',     'Permissions',      'nav', 1),
  ('nav.platform',        'Platform',         'nav', 1),
  ('nav.configuration',   'Configuration',    'nav', 1),
  -- settings (missing ones)
  ('settings.cache',               'Cache',                  'settings', 1),
  ('settings.cache_desc',          'Manage cache settings',  'settings', 1),
  ('settings.common',              'Common',                 'settings', 1),
  ('settings.localization',        'Localization',           'settings', 1),
  ('settings.optimize',            'Optimize',               'settings', 1),
  ('settings.optimize_desc',       'Performance optimization','settings', 1),
  ('settings.optimize_settings_view','Optimization Settings','settings', 1),
  ('settings.performance',         'Performance',            'settings', 1),
  -- dashboard (missing ones)
  ('dashboard.total_users',   'Total Users',   'dashboard', 1),
  -- languages (missing ones)
  ('languages.delete_confirm',      'Confirm delete?',              'languages', 1),
  ('languages.please_wait',         'Please wait...',               'languages', 1),
  ('languages.translate_all_confirm','Translate all keys?',         'languages', 1),
  ('languages.translating_progress','Translation in progress...',   'languages', 1),
  -- translations (missing ones)
  ('translations.enter_group_name', 'Enter group name', 'translations', 1),
  -- roles (missing ones)
  ('roles.edit',          'Edit Role',         'roles', 1),
  ('roles.manage_roles',  'Manage Roles',      'roles', 1),
  -- appearance
  ('appearance.menu',          'Menu',           'appearance', 1),
  ('appearance.theme',         'Theme',          'appearance', 1),
  ('appearance.theme_options', 'Theme Options',  'appearance', 1)
ON DUPLICATE KEY UPDATE `default_value` = VALUES(`default_value`), `company_id` = VALUES(`company_id`);

-- Back-fill company_id on translation_keys that were inserted without it
SET SQL_SAFE_UPDATES = 0;
UPDATE `translation_keys` SET `company_id` = 1 WHERE `company_id` IS NULL;
SET SQL_SAFE_UPDATES = 1;

-- Insert English translations using the seeded language (id=1)
INSERT INTO `translations` (`translation_key_id`, `language_id`, `company_id`, `value`, `status`, `is_active`)
SELECT tk.id, 1, 1, tk.default_value, 'reviewed', 1
FROM `translation_keys` tk
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `status` = 'reviewed', `company_id` = 1;

-- =============================================================================
-- DONE
-- =============================================================================

SELECT 'Database setup complete!' AS status;
SELECT 'Credentials  →  developer@admin.com | superadmin@admin.com | admin@admin.com  (pwd: 123456)' AS credentials;
