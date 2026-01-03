-- Create Database
CREATE DATABASE stream_vision;

USE stream_vision;

-- Users Table
drop table stream_vision.users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL -- Store hashed passwords
);

-- Locations Table
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(100) UNIQUE NOT NULL
);

-- DVRs Table
CREATE TABLE dvrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    dvr_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
);

-- Cameras Table
CREATE TABLE cameras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dvr_id INT NOT NULL,
    camera_name VARCHAR(100) NOT NULL,
    rtsp_url VARCHAR(255) NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    FOREIGN KEY (dvr_id) REFERENCES dvrs (id) ON DELETE CASCADE
);

-- Settings Table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL
);

-- Insert Sample Data for Testing
INSERT INTO
    users (username, password_hash)
VALUES (
        'admin',
        'hashed_password_here'
    );

INSERT INTO
    locations (location_name)
VALUES ('Location A'),
    ('Location B');

INSERT INTO
    dvrs (location_id, dvr_name)
VALUES (1, 'DVR 1'),
    (1, 'DVR 2'),
    (2, 'DVR 3');

INSERT INTO
    cameras (dvr_id, camera_name, rtsp_url)
VALUES (
        1,
        'Camera 1',
        'rtsp://example.com/camera1'
    ),
    (
        1,
        'Camera 2',
        'rtsp://example.com/camera2'
    ),
    (
        2,
        'Camera 3',
        'rtsp://example.com/camera3'
    );

INSERT INTO settings (setting_key, setting_value) VALUES ('app_name', 'StreamVision');

Explanation:

                                                        Users Table: Stores login credentials.

                                                        Locations Table: Represents different locations where DVRs are installed.

                                                        DVRs Table: Associates DVRs with locations.

                                                        Cameras Table: Stores 16 cameras per DVR with RTSP URLs.
                                                        
                                                        Settings Table: Stores application settings.


                                                        Let me know if you need modifications or additional features!