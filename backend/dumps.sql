-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: bus_tracker
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_credentials`
--

DROP TABLE IF EXISTS `admin_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_credentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_credentials`
--

LOCK TABLES `admin_credentials` WRITE;
/*!40000 ALTER TABLE `admin_credentials` DISABLE KEYS */;
INSERT INTO `admin_credentials` VALUES (1,'tracking','admin123'),(2,'booking','admin');
/*!40000 ALTER TABLE `admin_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_ref` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trip_id` bigint NOT NULL,
  `seat_no` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passenger_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passenger_age` int DEFAULT NULL,
  `passenger_gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passenger_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passenger_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_stop_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_stop_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `booked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `travel_date` date DEFAULT NULL,
  `from_stop_seq` int DEFAULT NULL,
  `to_stop_seq` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_ref` (`booking_ref`),
  KEY `trip_id` (`trip_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'WB-20260411-40675',14,'C2','Rahul kumar',25,'Male','09534038515','','dehradun','rishikesh',500.00,'cancelled','2026-04-11 04:41:01',NULL,NULL,NULL),(2,'WB-20260411-95914',18,'A3','Rahul kumar',34,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:50:16',NULL,NULL,NULL),(3,'WB-20260411-37467',18,'B3','RAM DINESH KUMAR & INDU DEVI',44,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:50:17',NULL,NULL,NULL),(4,'WB-20260411-51542',18,'C3','Rahul kumar',42,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:50:17',NULL,NULL,NULL),(5,'WB-20260411-78804',18,'D3','RAM DINESH KUMAR & INDU DEVI',44,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:50:17',NULL,NULL,NULL),(6,'WB-20260411-28180',18,'A5','Rahul kumar',32,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:55:28',NULL,NULL,NULL),(7,'WB-20260411-40953',18,'B5','Rahul Singh',46,'Male','09534038515','rahulsingh.11gts@gmail.com','Tata','Ara',500.00,'cancelled','2026-04-11 04:55:29',NULL,NULL,NULL),(8,'WB-20260411-07132',18,'C5','RAM DINESH KUMAR & INDU DEVI',34,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:55:29',NULL,NULL,NULL),(9,'WB-20260411-38998',18,'D5','RAM DINESH KUMAR & INDU DEVI',22,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 04:55:29',NULL,NULL,NULL),(10,'WB-20260411-54528',18,'A7','Rahul kumar33',31,'Male','09534038515','','Tata','Ara',500.00,'confirmed','2026-04-11 05:21:16','2026-04-10',NULL,NULL),(11,'WB-20260411-86924',18,'C7','Rahul kumar3',33,'Male','09534038515','','Tata','Ara',500.00,'cancelled','2026-04-11 05:21:17','2026-04-10',NULL,NULL),(12,'WB-20260411-31573',18,'D7','Rahul kumart',33,'Male','095340385153','','Tata','Ara',500.00,'cancelled','2026-04-11 05:21:17','2026-04-10',NULL,NULL),(13,'WB-20260411-58423',14,'C3','Rahul kumar',6554,'Male','09534038515','','Dehradun','Rishikesh',500.00,'confirmed','2026-04-11 05:25:38','2026-04-15',NULL,NULL),(14,'WB-20260411-68262',14,'D3','ramesh',2345,'Male','845606266206946','','Dehradun','Rishikesh',500.00,'confirmed','2026-04-11 05:25:38','2026-04-15',NULL,NULL),(15,'WB-20260411-43944',30,'A1','Rahul kumar',22,'Male','09534038515','','Aurangabad','Mango',600.00,'cancelled','2026-04-11 13:32:12','2026-04-11',NULL,NULL),(16,'WB-20260411-01405',30,'B1','Rahul kumar',22,'Male','09534038515','','Aurangabad','Mango',600.00,'cancelled','2026-04-11 13:32:13','2026-04-11',NULL,NULL),(17,'WB-20260411-34382',30,'A1','Rahul kumar',25,'Male','9534038515','','Ara','Aurangabad',301.00,'confirmed','2026-04-11 14:10:52','2026-04-15',NULL,NULL),(18,'WB-20260411-61577',30,'B1','Gayatri Mehta',23,'Female','7505309889','','Ara','Aurangabad',301.00,'confirmed','2026-04-11 14:10:52','2026-04-15',NULL,NULL),(19,'WB-20260411-22988',48,'A1','Rahul kumar',33,'Male','09534038515','','Dehradun','Bhagwanpur',110.00,'confirmed','2026-04-11 14:15:55','2026-04-14',NULL,NULL),(20,'WB-20260411-88776',30,'C6','RAM DINESH KUMAR & INDU DEVI',66,'Male','09534038515','','Ara','Aurangabad',301.00,'cancelled','2026-04-11 21:48:17','2026-04-16',NULL,NULL),(21,'WB-20260411-18329',30,'A8','Rahul kumar',53,'Male','09534038515','','Ara','Aurangabad',301.00,'confirmed','2026-04-11 21:48:17','2026-04-16',NULL,NULL);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bus_locations`
--

DROP TABLE IF EXISTS `bus_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bus_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `heading_deg` decimal(6,2) DEFAULT NULL,
  `lat` decimal(10,7) NOT NULL,
  `lng` decimal(10,7) NOT NULL,
  `speed_kmph` decimal(6,2) DEFAULT NULL,
  `bus_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlj5f60d8cknlqlog6src21rq6` (`bus_id`),
  CONSTRAINT `FKlj5f60d8cknlqlog6src21rq6` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bus_locations`
--

LOCK TABLES `bus_locations` WRITE;
/*!40000 ALTER TABLE `bus_locations` DISABLE KEYS */;
INSERT INTO `bus_locations` VALUES (1,'2025-11-17 16:12:13.188797',90.00,19.0820000,72.8820000,15.50,1),(2,'2025-11-17 19:22:24.052382',90.00,19.0820000,72.8820000,15.50,1),(3,'2025-11-18 10:51:29.765538',90.00,19.0820000,72.8820000,15.50,1),(4,'2025-11-19 16:08:11.933837',90.00,19.0820000,72.8820000,15.50,1),(5,'2025-11-19 16:50:16.432758',90.00,19.0820000,72.8820000,15.50,1),(6,'2025-11-25 14:39:38.736450',90.00,29.8640965,77.8887439,15.50,1),(7,'2025-11-25 15:23:03.839971',90.00,29.9106926,77.8414060,15.50,1),(8,'2025-11-25 18:25:46.424958',90.00,30.1782233,77.9051337,15.50,1),(9,'2025-11-25 18:54:58.227361',90.00,30.1782233,77.9051337,15.50,1),(10,'2025-11-26 13:44:03.334325',90.00,19.0820000,72.8820000,15.50,1),(11,'2025-11-26 14:07:12.755000',90.00,30.0321000,77.7533000,15.50,1),(12,'2025-11-26 14:09:26.504626',90.00,30.0694000,77.8400000,20.50,1),(13,'2025-11-26 14:10:20.070259',90.00,29.8663000,77.8912000,20.50,1),(14,'2025-11-26 14:19:48.025886',90.00,30.2892662,77.9985028,20.50,1),(15,'2025-11-26 14:24:49.281420',90.00,30.1967000,78.0876500,20.50,1),(16,'2025-11-26 14:25:30.549541',90.00,30.0321000,77.7533000,20.50,1),(17,'2025-11-26 14:26:05.945595',90.00,29.8663000,77.8912000,20.50,1),(18,'2025-11-26 16:11:55.581320',90.00,30.1129952,78.2955996,20.50,1),(19,'2025-11-26 18:26:25.469929',90.00,30.0321000,77.7533000,20.50,1),(20,'2025-11-26 18:30:38.017271',90.00,30.0021000,77.7033000,20.50,3),(21,'2025-11-26 18:31:16.804513',90.00,300.0021000,770.7033000,20.50,1),(22,'2025-11-26 18:36:24.500208',90.00,30.0321000,78.2955996,20.50,1),(23,'2025-11-26 18:36:54.381753',90.00,30.1129952,78.2955996,20.50,1),(27,'2025-11-27 16:09:46.088569',90.00,30.2892662,77.9985028,20.50,2),(28,'2025-11-27 19:12:18.962638',90.00,29.7035087,77.7196284,20.50,2),(29,'2025-11-27 20:34:10.893292',90.00,29.7035087,77.7196284,20.50,2),(30,'2025-11-28 14:49:37.329464',90.00,29.8663000,77.8912000,20.50,1),(31,'2025-11-28 15:22:42.090214',90.00,28.6688016,77.2308832,20.50,2),(36,'2025-11-29 11:46:48.189531',90.00,25.5546738,84.6724262,20.50,3),(37,'2025-11-29 17:34:37.007736',90.00,29.9371672,77.8304471,20.50,3),(38,'2025-11-29 17:34:49.549432',90.00,29.9371672,77.8304471,20.50,1),(39,'2025-11-29 17:35:17.987187',90.00,29.9371672,77.8304471,20.50,2),(40,'2025-11-29 17:36:56.240964',90.00,29.9371672,77.8304471,20.50,2),(41,'2025-11-29 17:37:34.111913',90.00,30.0694000,77.8400000,20.50,1),(43,'2025-11-29 18:15:23.999724',90.00,23.9912734,85.3506846,20.50,4),(44,'2025-12-15 07:18:24.062689',90.00,29.8663000,77.8912000,20.50,1),(45,'2026-01-07 05:06:34.180442',90.00,30.0321000,77.7533000,20.50,1),(46,'2026-01-07 05:10:13.733366',90.00,28.6688016,77.2308832,50.50,2),(47,'2026-01-07 05:11:29.573028',90.00,29.7035087,77.7196284,50.50,2),(48,'2026-04-10 08:11:59.367092',90.00,29.9371672,77.8304471,20.50,2);
/*!40000 ALTER TABLE `bus_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bus_state`
--

DROP TABLE IF EXISTS `bus_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bus_state` (
  `id` bigint NOT NULL,
  `heading_deg` decimal(6,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `speed_kmph` decimal(6,2) DEFAULT NULL,
  `route_id` bigint DEFAULT NULL,
  `bus_id` bigint NOT NULL,
  `last_ping_at` datetime(6) DEFAULT NULL,
  `at_stop` bit(1) DEFAULT NULL,
  `nearest_stop_id` bigint DEFAULT NULL,
  `active_trip_date` date DEFAULT NULL,
  `active_trip_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgv2lwfhthdqy35n8mlicvmtrc` (`route_id`),
  KEY `FKltstcejluqxlum2pg9157ls7q` (`bus_id`),
  KEY `fk_busstate_active_trip` (`active_trip_id`),
  CONSTRAINT `fk_busstate_active_trip` FOREIGN KEY (`active_trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FKarpb9hff7260dn3vtdg0qh9k8` FOREIGN KEY (`id`) REFERENCES `buses` (`id`),
  CONSTRAINT `FKgv2lwfhthdqy35n8mlicvmtrc` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
  CONSTRAINT `FKltstcejluqxlum2pg9157ls7q` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bus_state`
--

LOCK TABLES `bus_state` WRITE;
/*!40000 ALTER TABLE `bus_state` DISABLE KEYS */;
INSERT INTO `bus_state` VALUES (1,0.00,'2026-04-12 03:46:13.974445',30.0321000,77.7533000,90.00,1,1,'2026-04-12 03:46:13.974445',_binary '\0',7,'2026-04-12',43),(2,90.00,'2026-04-11 01:56:54.630947',30.2892662,77.9972830,56.00,2,2,'2026-04-11 01:56:54.630947',_binary '\0',14,NULL,NULL),(3,0.00,'2026-04-12 03:42:40.259136',22.9385679,86.0494959,90.00,3,3,'2026-04-12 03:42:40.259136',_binary '\0',32,'2026-04-12',32),(4,0.00,'2026-04-11 04:48:36.149389',22.8157607,86.2115739,0.00,4,4,'2026-04-11 04:48:36.149389',_binary '\0',43,NULL,NULL),(5,0.00,'2026-04-11 14:19:02.683230',28.6138444,77.2082486,0.00,5,5,'2026-04-11 14:19:02.683230',_binary '\0',47,NULL,NULL),(7,0.00,'2026-04-11 14:38:08.301540',30.1129952,78.2955996,0.00,7,7,'2026-04-11 14:38:08.301540',_binary '\0',NULL,NULL,NULL),(8,110.00,'2026-04-11 01:33:20.775426',28.6692000,77.4538000,98.00,8,8,'2026-04-11 01:33:20.775426',_binary '\0',NULL,NULL,NULL),(10,98.00,'2026-04-12 03:24:48.508724',23.9912734,85.3506846,120.00,3,10,'2026-04-12 03:24:48.508724',_binary '\0',NULL,'2026-04-11',17);
/*!40000 ALTER TABLE `bus_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buses`
--

DROP TABLE IF EXISTS `buses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plate` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_id` bigint DEFAULT NULL,
  `route_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj6x5ksk9346i5xm195qlx0he8` (`code`),
  KEY `FKehawq87sfla3c9m3anighxeaf` (`driver_id`),
  KEY `FKryb7cf7s26rht8lyp8ry0ek0g` (`route_id`),
  CONSTRAINT `FKehawq87sfla3c9m3anighxeaf` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `FKryb7cf7s26rht8lyp8ry0ek0g` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buses`
--

LOCK TABLES `buses` WRITE;
/*!40000 ALTER TABLE `buses` DISABLE KEYS */;
INSERT INTO `buses` VALUES (1,1,'B10A','UK-07 RA 2654',1,1),(2,1,'DL- 20 A','DL-01 PR 7777',2,2),(3,1,'BR-03 ','BR03 PW 8515',3,3),(4,1,'JH-05','JH05 PA 9795',4,4),(5,1,'MH-05','MH-05 RA 5864',1,5),(7,1,'UK07-RISH-DEH','UK08-PM1298',3,7),(8,1,'DL-HAL','UK 04 RA 3955',1,8),(10,1,'Rahul Travels','JH-05 MP 8645',1,3);
/*!40000 ALTER TABLE `buses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES (1,'rahul','9534038515'),(2,'pawan','995578268'),(3,'goldy','9543156975'),(4,'sangeet','3597456661'),(5,'Himashu Albella','9865234699');
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_route_stops`
--

DROP TABLE IF EXISTS `review_route_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_route_stops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `route_id` bigint NOT NULL,
  `stop_id` bigint NOT NULL,
  `seq` int NOT NULL,
  `offset_min` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_route_stops`
--

LOCK TABLES `review_route_stops` WRITE;
/*!40000 ALTER TABLE `review_route_stops` DISABLE KEYS */;
INSERT INTO `review_route_stops` VALUES (1,1,1,1,0),(2,1,2,2,10),(3,1,3,3,12),(4,1,4,4,20),(5,1,5,5,30),(6,1,6,6,40),(7,1,7,7,50),(8,1,8,8,60),(9,1,9,9,62),(10,1,10,10,70),(11,1,11,11,90);
/*!40000 ALTER TABLE `review_route_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_route_stops_backup`
--

DROP TABLE IF EXISTS `review_route_stops_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_route_stops_backup` (
  `id` bigint NOT NULL DEFAULT '0',
  `route_id` bigint NOT NULL,
  `stop_id` bigint NOT NULL,
  `seq` int NOT NULL,
  `offset_min` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_route_stops_backup`
--

LOCK TABLES `review_route_stops_backup` WRITE;
/*!40000 ALTER TABLE `review_route_stops_backup` DISABLE KEYS */;
INSERT INTO `review_route_stops_backup` VALUES (1,3,1,1,0),(2,3,2,2,10),(3,3,3,3,60),(4,3,3,4,60);
/*!40000 ALTER TABLE `review_route_stops_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_pricing`
--

DROP TABLE IF EXISTS `route_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_pricing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `route_id` bigint NOT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT '500.00',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `route_id` (`route_id`),
  CONSTRAINT `route_pricing_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_pricing`
--

LOCK TABLES `route_pricing` WRITE;
/*!40000 ALTER TABLE `route_pricing` DISABLE KEYS */;
INSERT INTO `route_pricing` VALUES (1,3,1.00,'2026-04-11 13:58:51'),(2,2,0.00,'2026-04-11 14:00:29'),(3,1,0.00,'2026-04-11 14:00:31'),(4,8,0.00,'2026-04-11 14:00:33'),(6,5,0.00,'2026-04-11 14:00:37'),(7,7,0.00,'2026-04-11 14:00:39'),(8,4,0.00,'2026-04-11 14:00:40');
/*!40000 ALTER TABLE `route_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_stops`
--

DROP TABLE IF EXISTS `route_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_stops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `route_id` bigint NOT NULL,
  `stop_id` bigint NOT NULL,
  `seq` int NOT NULL,
  `offset_min` int NOT NULL,
  `price_offset` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `route_id` (`route_id`,`seq`),
  KEY `fk_route_stops_stop` (`stop_id`),
  CONSTRAINT `fk_route_stops_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
  CONSTRAINT `fk_route_stops_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_stops`
--

LOCK TABLES `route_stops` WRITE;
/*!40000 ALTER TABLE `route_stops` DISABLE KEYS */;
INSERT INTO `route_stops` VALUES (1,1,1,1,0,0),(2,1,2,2,10,20),(3,1,3,3,20,20),(4,1,4,4,30,40),(5,1,5,5,40,40),(6,1,6,6,50,60),(7,1,7,7,60,80),(8,1,8,8,70,80),(9,1,9,9,80,80),(10,1,10,10,90,110),(11,1,11,11,100,120),(12,1,12,12,110,180),(13,1,13,13,120,240),(14,2,14,1,0,0),(15,2,15,2,45,40),(16,2,16,3,60,100),(17,2,17,4,95,150),(18,2,18,5,123,250),(19,2,19,6,148,250),(20,2,22,9,197,495),(21,2,23,10,290,495),(24,3,24,1,0,0),(25,3,25,2,120,100),(26,3,26,3,210,200),(27,3,27,4,450,300),(28,3,28,5,510,300),(29,3,29,6,570,300),(30,3,30,7,630,400),(31,3,31,8,690,400),(32,3,32,9,700,650),(33,3,33,10,750,650),(34,4,34,1,0,0),(35,4,35,2,60,150),(36,4,36,3,90,150),(37,4,37,4,270,250),(38,4,38,5,330,300),(39,4,39,6,390,300),(40,4,40,7,450,350),(41,4,41,8,510,450),(42,4,42,9,520,500),(43,4,43,10,570,550),(44,8,50,1,1,0),(45,8,51,2,30,40),(46,8,52,3,50,60),(47,8,53,4,70,190),(48,8,54,5,90,190),(49,8,55,6,120,240),(50,8,56,7,150,380),(51,8,57,8,180,490);
/*!40000 ALTER TABLE `route_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgclhuhdkauatimjoqj7kc210i` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routes`
--

LOCK TABLES `routes` WRITE;
/*!40000 ALTER TABLE `routes` DISABLE KEYS */;
INSERT INTO `routes` VALUES (3,'Ara - Tata'),(2,'Dehradun - New Delhi'),(1,'Dehradun - Rishikesh'),(8,'Delhi - Haldwani'),(5,'Delhi-Mumbai'),(7,'Rishikesh-Dehradun'),(4,'Tata - Ara');
/*!40000 ALTER TABLE `routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_layouts`
--

DROP TABLE IF EXISTS `seat_layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat_layouts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bus_id` bigint NOT NULL,
  `total_seats` int NOT NULL DEFAULT '40',
  `layout_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_id` (`bus_id`),
  CONSTRAINT `seat_layouts_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_layouts`
--

LOCK TABLES `seat_layouts` WRITE;
/*!40000 ALTER TABLE `seat_layouts` DISABLE KEYS */;
INSERT INTO `seat_layouts` VALUES (1,4,40,'[{\"seatNo\":\"A1\",\"row\":0,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B1\",\"row\":0,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C1\",\"row\":0,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D1\",\"row\":0,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A2\",\"row\":1,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B2\",\"row\":1,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C2\",\"row\":1,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D2\",\"row\":1,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A3\",\"row\":2,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B3\",\"row\":2,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C3\",\"row\":2,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D3\",\"row\":2,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A4\",\"row\":3,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B4\",\"row\":3,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C4\",\"row\":3,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D4\",\"row\":3,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A5\",\"row\":4,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B5\",\"row\":4,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C5\",\"row\":4,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D5\",\"row\":4,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A6\",\"row\":5,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B6\",\"row\":5,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C6\",\"row\":5,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D6\",\"row\":5,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A7\",\"row\":6,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B7\",\"row\":6,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C7\",\"row\":6,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D7\",\"row\":6,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A8\",\"row\":7,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B8\",\"row\":7,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C8\",\"row\":7,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D8\",\"row\":7,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A9\",\"row\":8,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B9\",\"row\":8,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C9\",\"row\":8,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D9\",\"row\":8,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A10\",\"row\":9,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B10\",\"row\":9,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C10\",\"row\":9,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D10\",\"row\":9,\"col\":3,\"type\":\"window\"}]'),(2,10,40,'[{\"seatNo\":\"A1\",\"row\":0,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B1\",\"row\":0,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C1\",\"row\":0,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D1\",\"row\":0,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A2\",\"row\":1,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B2\",\"row\":1,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C2\",\"row\":1,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D2\",\"row\":1,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A3\",\"row\":2,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B3\",\"row\":2,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C3\",\"row\":2,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D3\",\"row\":2,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A4\",\"row\":3,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B4\",\"row\":3,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C4\",\"row\":3,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D4\",\"row\":3,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A5\",\"row\":4,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B5\",\"row\":4,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C5\",\"row\":4,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D5\",\"row\":4,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A6\",\"row\":5,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B6\",\"row\":5,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C6\",\"row\":5,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D6\",\"row\":5,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A7\",\"row\":6,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B7\",\"row\":6,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C7\",\"row\":6,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D7\",\"row\":6,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A8\",\"row\":7,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B8\",\"row\":7,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C8\",\"row\":7,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D8\",\"row\":7,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A9\",\"row\":8,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B9\",\"row\":8,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C9\",\"row\":8,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D9\",\"row\":8,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A10\",\"row\":9,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B10\",\"row\":9,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C10\",\"row\":9,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D10\",\"row\":9,\"col\":3,\"type\":\"window\"}]'),(3,1,40,'[{\"seatNo\":\"A1\",\"row\":0,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B1\",\"row\":0,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C1\",\"row\":0,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D1\",\"row\":0,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A2\",\"row\":1,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B2\",\"row\":1,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C2\",\"row\":1,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D2\",\"row\":1,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A3\",\"row\":2,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B3\",\"row\":2,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C3\",\"row\":2,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D3\",\"row\":2,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A4\",\"row\":3,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B4\",\"row\":3,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C4\",\"row\":3,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D4\",\"row\":3,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A5\",\"row\":4,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B5\",\"row\":4,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C5\",\"row\":4,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D5\",\"row\":4,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A6\",\"row\":5,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B6\",\"row\":5,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C6\",\"row\":5,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D6\",\"row\":5,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A7\",\"row\":6,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B7\",\"row\":6,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C7\",\"row\":6,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D7\",\"row\":6,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A8\",\"row\":7,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B8\",\"row\":7,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C8\",\"row\":7,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D8\",\"row\":7,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A9\",\"row\":8,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B9\",\"row\":8,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C9\",\"row\":8,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D9\",\"row\":8,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A10\",\"row\":9,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B10\",\"row\":9,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C10\",\"row\":9,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D10\",\"row\":9,\"col\":3,\"type\":\"window\"}]'),(4,3,40,'[{\"seatNo\":\"A1\",\"row\":0,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B1\",\"row\":0,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C1\",\"row\":0,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D1\",\"row\":0,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A2\",\"row\":1,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B2\",\"row\":1,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C2\",\"row\":1,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D2\",\"row\":1,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A3\",\"row\":2,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B3\",\"row\":2,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C3\",\"row\":2,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D3\",\"row\":2,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A4\",\"row\":3,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B4\",\"row\":3,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C4\",\"row\":3,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D4\",\"row\":3,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A5\",\"row\":4,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B5\",\"row\":4,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C5\",\"row\":4,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D5\",\"row\":4,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A6\",\"row\":5,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B6\",\"row\":5,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C6\",\"row\":5,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D6\",\"row\":5,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A7\",\"row\":6,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B7\",\"row\":6,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C7\",\"row\":6,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D7\",\"row\":6,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A8\",\"row\":7,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B8\",\"row\":7,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C8\",\"row\":7,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D8\",\"row\":7,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A9\",\"row\":8,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B9\",\"row\":8,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C9\",\"row\":8,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D9\",\"row\":8,\"col\":3,\"type\":\"window\"},{\"seatNo\":\"A10\",\"row\":9,\"col\":0,\"type\":\"window\"},{\"seatNo\":\"B10\",\"row\":9,\"col\":1,\"type\":\"aisle\"},{\"seatNo\":\"C10\",\"row\":9,\"col\":2,\"type\":\"aisle\"},{\"seatNo\":\"D10\",\"row\":9,\"col\":3,\"type\":\"window\"}]');
/*!40000 ALTER TABLE `seat_layouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stop_times`
--

DROP TABLE IF EXISTS `stop_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stop_times` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `stop_id` bigint NOT NULL,
  `arrival_datetime` datetime NOT NULL,
  `departure_datetime` datetime NOT NULL,
  `seq` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_id` (`trip_id`,`seq`),
  KEY `fk_stoptimes_stop` (`stop_id`),
  CONSTRAINT `fk_stoptimes_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`),
  CONSTRAINT `fk_stoptimes_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=581 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stop_times`
--

LOCK TABLES `stop_times` WRITE;
/*!40000 ALTER TABLE `stop_times` DISABLE KEYS */;
INSERT INTO `stop_times` VALUES (92,5,44,'2025-11-27 05:02:00','2025-11-27 05:02:00',1),(93,5,45,'2025-11-27 06:05:00','2025-11-27 06:07:00',2),(94,5,46,'2025-11-27 10:02:00','2025-11-27 10:05:00',3),(95,5,47,'2025-11-27 16:02:00','2025-11-27 16:02:00',4),(96,9,48,'2025-11-27 05:40:00','2025-11-27 05:40:00',1),(97,9,49,'2025-11-27 05:40:00','2025-11-27 05:40:00',2),(98,12,50,'2026-04-11 16:08:00','2026-04-11 16:10:00',1),(99,12,51,'2026-04-11 16:37:00','2026-04-11 16:39:00',2),(100,12,52,'2026-04-11 16:57:00','2026-04-11 16:59:00',3),(101,12,53,'2026-04-11 17:17:00','2026-04-11 17:19:00',4),(102,12,54,'2026-04-11 17:37:00','2026-04-11 17:39:00',5),(103,12,55,'2026-04-11 18:07:00','2026-04-11 18:09:00',6),(104,12,56,'2026-04-11 18:37:00','2026-04-11 18:39:00',7),(105,12,57,'2026-04-11 19:07:00','2026-04-11 19:09:00',8),(106,13,14,'2026-04-11 02:53:00','2026-04-11 02:55:00',1),(107,13,15,'2026-04-11 03:38:00','2026-04-11 03:40:00',2),(108,13,16,'2026-04-11 03:53:00','2026-04-11 03:55:00',3),(109,13,17,'2026-04-11 04:28:00','2026-04-11 04:30:00',4),(110,13,18,'2026-04-11 04:56:00','2026-04-11 04:58:00',5),(111,13,19,'2026-04-11 05:21:00','2026-04-11 05:23:00',6),(112,13,22,'2026-04-11 06:10:00','2026-04-11 06:12:00',7),(113,13,23,'2026-04-11 07:43:00','2026-04-11 07:45:00',8),(114,14,1,'2026-04-10 19:00:00','2026-04-10 19:02:00',1),(115,14,2,'2026-04-10 19:10:00','2026-04-10 19:12:00',2),(116,14,3,'2026-04-10 19:20:00','2026-04-10 19:22:00',3),(117,14,4,'2026-04-10 19:30:00','2026-04-10 19:32:00',4),(118,14,5,'2026-04-10 19:40:00','2026-04-10 19:42:00',5),(119,14,6,'2026-04-10 19:50:00','2026-04-10 19:52:00',6),(120,14,7,'2026-04-10 20:00:00','2026-04-10 20:02:00',7),(121,14,8,'2026-04-10 20:10:00','2026-04-10 20:12:00',8),(122,14,9,'2026-04-10 20:20:00','2026-04-10 20:22:00',9),(123,14,10,'2026-04-10 20:30:00','2026-04-10 20:32:00',10),(124,14,11,'2026-04-10 20:40:00','2026-04-10 20:42:00',11),(125,14,12,'2026-04-10 20:50:00','2026-04-10 20:52:00',12),(126,14,13,'2026-04-10 21:00:00','2026-04-10 21:02:00',13),(147,17,24,'2026-04-11 18:22:00','2026-04-11 18:24:00',1),(148,17,25,'2026-04-11 20:22:00','2026-04-11 20:24:00',2),(149,17,26,'2026-04-11 21:52:00','2026-04-11 21:54:00',3),(150,17,27,'2026-04-12 01:52:00','2026-04-12 01:54:00',4),(151,17,28,'2026-04-12 02:52:00','2026-04-12 02:54:00',5),(152,17,29,'2026-04-12 03:52:00','2026-04-12 03:54:00',6),(153,17,30,'2026-04-12 04:52:00','2026-04-12 04:54:00',7),(154,17,31,'2026-04-12 05:52:00','2026-04-12 05:54:00',8),(155,17,32,'2026-04-12 06:02:00','2026-04-12 06:04:00',9),(156,17,33,'2026-04-12 06:52:00','2026-04-12 06:54:00',10),(157,18,34,'2026-04-11 19:00:00','2026-04-11 19:02:00',1),(158,18,35,'2026-04-11 20:00:00','2026-04-11 20:02:00',2),(159,18,36,'2026-04-11 20:30:00','2026-04-11 20:32:00',3),(160,18,37,'2026-04-11 23:30:00','2026-04-11 23:32:00',4),(161,18,38,'2026-04-12 00:30:00','2026-04-12 00:32:00',5),(162,18,39,'2026-04-12 01:30:00','2026-04-12 01:32:00',6),(163,18,40,'2026-04-12 02:30:00','2026-04-12 02:32:00',7),(164,18,41,'2026-04-12 03:30:00','2026-04-12 03:32:00',8),(165,18,42,'2026-04-12 03:40:00','2026-04-12 03:42:00',9),(166,18,43,'2026-04-12 04:30:00','2026-04-12 04:32:00',10),(167,19,24,'2026-04-12 18:22:00','2026-04-12 18:24:00',1),(168,19,25,'2026-04-12 20:22:00','2026-04-12 20:24:00',2),(169,19,26,'2026-04-12 21:52:00','2026-04-12 21:54:00',3),(170,19,27,'2026-04-13 01:52:00','2026-04-13 01:54:00',4),(171,19,28,'2026-04-13 02:52:00','2026-04-13 02:54:00',5),(172,19,29,'2026-04-13 03:52:00','2026-04-13 03:54:00',6),(173,19,30,'2026-04-13 04:52:00','2026-04-13 04:54:00',7),(174,19,31,'2026-04-13 05:52:00','2026-04-13 05:54:00',8),(175,19,32,'2026-04-13 06:02:00','2026-04-13 06:04:00',9),(176,19,33,'2026-04-13 06:52:00','2026-04-13 06:54:00',10),(177,20,24,'2026-04-13 18:22:00','2026-04-13 18:24:00',1),(178,20,25,'2026-04-13 20:22:00','2026-04-13 20:24:00',2),(179,20,26,'2026-04-13 21:52:00','2026-04-13 21:54:00',3),(180,20,27,'2026-04-14 01:52:00','2026-04-14 01:54:00',4),(181,20,28,'2026-04-14 02:52:00','2026-04-14 02:54:00',5),(182,20,29,'2026-04-14 03:52:00','2026-04-14 03:54:00',6),(183,20,30,'2026-04-14 04:52:00','2026-04-14 04:54:00',7),(184,20,31,'2026-04-14 05:52:00','2026-04-14 05:54:00',8),(185,20,32,'2026-04-14 06:02:00','2026-04-14 06:04:00',9),(186,20,33,'2026-04-14 06:52:00','2026-04-14 06:54:00',10),(187,21,24,'2026-04-14 18:22:00','2026-04-14 18:24:00',1),(188,21,25,'2026-04-14 20:22:00','2026-04-14 20:24:00',2),(189,21,26,'2026-04-14 21:52:00','2026-04-14 21:54:00',3),(190,21,27,'2026-04-15 01:52:00','2026-04-15 01:54:00',4),(191,21,28,'2026-04-15 02:52:00','2026-04-15 02:54:00',5),(192,21,29,'2026-04-15 03:52:00','2026-04-15 03:54:00',6),(193,21,30,'2026-04-15 04:52:00','2026-04-15 04:54:00',7),(194,21,31,'2026-04-15 05:52:00','2026-04-15 05:54:00',8),(195,21,32,'2026-04-15 06:02:00','2026-04-15 06:04:00',9),(196,21,33,'2026-04-15 06:52:00','2026-04-15 06:54:00',10),(197,22,24,'2026-04-15 18:22:00','2026-04-15 18:24:00',1),(198,22,25,'2026-04-15 20:22:00','2026-04-15 20:24:00',2),(199,22,26,'2026-04-15 21:52:00','2026-04-15 21:54:00',3),(200,22,27,'2026-04-16 01:52:00','2026-04-16 01:54:00',4),(201,22,28,'2026-04-16 02:52:00','2026-04-16 02:54:00',5),(202,22,29,'2026-04-16 03:52:00','2026-04-16 03:54:00',6),(203,22,30,'2026-04-16 04:52:00','2026-04-16 04:54:00',7),(204,22,31,'2026-04-16 05:52:00','2026-04-16 05:54:00',8),(205,22,32,'2026-04-16 06:02:00','2026-04-16 06:04:00',9),(206,22,33,'2026-04-16 06:52:00','2026-04-16 06:54:00',10),(207,23,24,'2026-04-16 18:22:00','2026-04-16 18:24:00',1),(208,23,25,'2026-04-16 20:22:00','2026-04-16 20:24:00',2),(209,23,26,'2026-04-16 21:52:00','2026-04-16 21:54:00',3),(210,23,27,'2026-04-17 01:52:00','2026-04-17 01:54:00',4),(211,23,28,'2026-04-17 02:52:00','2026-04-17 02:54:00',5),(212,23,29,'2026-04-17 03:52:00','2026-04-17 03:54:00',6),(213,23,30,'2026-04-17 04:52:00','2026-04-17 04:54:00',7),(214,23,31,'2026-04-17 05:52:00','2026-04-17 05:54:00',8),(215,23,32,'2026-04-17 06:02:00','2026-04-17 06:04:00',9),(216,23,33,'2026-04-17 06:52:00','2026-04-17 06:54:00',10),(217,24,24,'2026-04-17 18:22:00','2026-04-17 18:24:00',1),(218,24,25,'2026-04-17 20:22:00','2026-04-17 20:24:00',2),(219,24,26,'2026-04-17 21:52:00','2026-04-17 21:54:00',3),(220,24,27,'2026-04-18 01:52:00','2026-04-18 01:54:00',4),(221,24,28,'2026-04-18 02:52:00','2026-04-18 02:54:00',5),(222,24,29,'2026-04-18 03:52:00','2026-04-18 03:54:00',6),(223,24,30,'2026-04-18 04:52:00','2026-04-18 04:54:00',7),(224,24,31,'2026-04-18 05:52:00','2026-04-18 05:54:00',8),(225,24,32,'2026-04-18 06:02:00','2026-04-18 06:04:00',9),(226,24,33,'2026-04-18 06:52:00','2026-04-18 06:54:00',10),(227,25,24,'2026-04-18 18:22:00','2026-04-18 18:24:00',1),(228,25,25,'2026-04-18 20:22:00','2026-04-18 20:24:00',2),(229,25,26,'2026-04-18 21:52:00','2026-04-18 21:54:00',3),(230,25,27,'2026-04-19 01:52:00','2026-04-19 01:54:00',4),(231,25,28,'2026-04-19 02:52:00','2026-04-19 02:54:00',5),(232,25,29,'2026-04-19 03:52:00','2026-04-19 03:54:00',6),(233,25,30,'2026-04-19 04:52:00','2026-04-19 04:54:00',7),(234,25,31,'2026-04-19 05:52:00','2026-04-19 05:54:00',8),(235,25,32,'2026-04-19 06:02:00','2026-04-19 06:04:00',9),(236,25,33,'2026-04-19 06:52:00','2026-04-19 06:54:00',10),(237,26,24,'2026-04-19 18:22:00','2026-04-19 18:24:00',1),(238,26,25,'2026-04-19 20:22:00','2026-04-19 20:24:00',2),(239,26,26,'2026-04-19 21:52:00','2026-04-19 21:54:00',3),(240,26,27,'2026-04-20 01:52:00','2026-04-20 01:54:00',4),(241,26,28,'2026-04-20 02:52:00','2026-04-20 02:54:00',5),(242,26,29,'2026-04-20 03:52:00','2026-04-20 03:54:00',6),(243,26,30,'2026-04-20 04:52:00','2026-04-20 04:54:00',7),(244,26,31,'2026-04-20 05:52:00','2026-04-20 05:54:00',8),(245,26,32,'2026-04-20 06:02:00','2026-04-20 06:04:00',9),(246,26,33,'2026-04-20 06:52:00','2026-04-20 06:54:00',10),(247,27,24,'2026-04-20 18:22:00','2026-04-20 18:24:00',1),(248,27,25,'2026-04-20 20:22:00','2026-04-20 20:24:00',2),(249,27,26,'2026-04-20 21:52:00','2026-04-20 21:54:00',3),(250,27,27,'2026-04-21 01:52:00','2026-04-21 01:54:00',4),(251,27,28,'2026-04-21 02:52:00','2026-04-21 02:54:00',5),(252,27,29,'2026-04-21 03:52:00','2026-04-21 03:54:00',6),(253,27,30,'2026-04-21 04:52:00','2026-04-21 04:54:00',7),(254,27,31,'2026-04-21 05:52:00','2026-04-21 05:54:00',8),(255,27,32,'2026-04-21 06:02:00','2026-04-21 06:04:00',9),(256,27,33,'2026-04-21 06:52:00','2026-04-21 06:54:00',10),(257,28,24,'2026-04-21 18:22:00','2026-04-21 18:24:00',1),(258,28,25,'2026-04-21 20:22:00','2026-04-21 20:24:00',2),(259,28,26,'2026-04-21 21:52:00','2026-04-21 21:54:00',3),(260,28,27,'2026-04-22 01:52:00','2026-04-22 01:54:00',4),(261,28,28,'2026-04-22 02:52:00','2026-04-22 02:54:00',5),(262,28,29,'2026-04-22 03:52:00','2026-04-22 03:54:00',6),(263,28,30,'2026-04-22 04:52:00','2026-04-22 04:54:00',7),(264,28,31,'2026-04-22 05:52:00','2026-04-22 05:54:00',8),(265,28,32,'2026-04-22 06:02:00','2026-04-22 06:04:00',9),(266,28,33,'2026-04-22 06:52:00','2026-04-22 06:54:00',10),(267,29,24,'2026-04-22 18:22:00','2026-04-22 18:24:00',1),(268,29,25,'2026-04-22 20:22:00','2026-04-22 20:24:00',2),(269,29,26,'2026-04-22 21:52:00','2026-04-22 21:54:00',3),(270,29,27,'2026-04-23 01:52:00','2026-04-23 01:54:00',4),(271,29,28,'2026-04-23 02:52:00','2026-04-23 02:54:00',5),(272,29,29,'2026-04-23 03:52:00','2026-04-23 03:54:00',6),(273,29,30,'2026-04-23 04:52:00','2026-04-23 04:54:00',7),(274,29,31,'2026-04-23 05:52:00','2026-04-23 05:54:00',8),(275,29,32,'2026-04-23 06:02:00','2026-04-23 06:04:00',9),(276,29,33,'2026-04-23 06:52:00','2026-04-23 06:54:00',10),(277,30,24,'2026-04-23 18:22:00','2026-04-23 18:24:00',1),(278,30,25,'2026-04-23 20:22:00','2026-04-23 20:24:00',2),(279,30,26,'2026-04-23 21:52:00','2026-04-23 21:54:00',3),(280,30,27,'2026-04-24 01:52:00','2026-04-24 01:54:00',4),(281,30,28,'2026-04-24 02:52:00','2026-04-24 02:54:00',5),(282,30,29,'2026-04-24 03:52:00','2026-04-24 03:54:00',6),(283,30,30,'2026-04-24 04:52:00','2026-04-24 04:54:00',7),(284,30,31,'2026-04-24 05:52:00','2026-04-24 05:54:00',8),(285,30,32,'2026-04-24 06:02:00','2026-04-24 06:04:00',9),(286,30,33,'2026-04-24 06:52:00','2026-04-24 06:54:00',10),(287,31,24,'2026-04-11 16:30:00','2026-04-11 16:32:00',1),(288,31,25,'2026-04-11 18:30:00','2026-04-11 18:32:00',2),(289,31,26,'2026-04-11 20:00:00','2026-04-11 20:02:00',3),(290,31,27,'2026-04-12 00:00:00','2026-04-12 00:02:00',4),(291,31,28,'2026-04-12 01:00:00','2026-04-12 01:02:00',5),(292,31,29,'2026-04-12 02:00:00','2026-04-12 02:02:00',6),(293,31,30,'2026-04-12 03:00:00','2026-04-12 03:02:00',7),(294,31,31,'2026-04-12 04:00:00','2026-04-12 04:02:00',8),(295,31,32,'2026-04-12 04:10:00','2026-04-12 04:12:00',9),(296,31,33,'2026-04-12 05:00:00','2026-04-12 05:02:00',10),(297,32,24,'2026-04-12 16:30:00','2026-04-12 16:32:00',1),(298,32,25,'2026-04-12 18:30:00','2026-04-12 18:32:00',2),(299,32,26,'2026-04-12 20:00:00','2026-04-12 20:02:00',3),(300,32,27,'2026-04-13 00:00:00','2026-04-13 00:02:00',4),(301,32,28,'2026-04-13 01:00:00','2026-04-13 01:02:00',5),(302,32,29,'2026-04-13 02:00:00','2026-04-13 02:02:00',6),(303,32,30,'2026-04-13 03:00:00','2026-04-13 03:02:00',7),(304,32,31,'2026-04-13 04:00:00','2026-04-13 04:02:00',8),(305,32,32,'2026-04-13 04:10:00','2026-04-13 04:12:00',9),(306,32,33,'2026-04-13 05:00:00','2026-04-13 05:02:00',10),(307,33,24,'2026-04-13 16:30:00','2026-04-13 16:32:00',1),(308,33,25,'2026-04-13 18:30:00','2026-04-13 18:32:00',2),(309,33,26,'2026-04-13 20:00:00','2026-04-13 20:02:00',3),(310,33,27,'2026-04-14 00:00:00','2026-04-14 00:02:00',4),(311,33,28,'2026-04-14 01:00:00','2026-04-14 01:02:00',5),(312,33,29,'2026-04-14 02:00:00','2026-04-14 02:02:00',6),(313,33,30,'2026-04-14 03:00:00','2026-04-14 03:02:00',7),(314,33,31,'2026-04-14 04:00:00','2026-04-14 04:02:00',8),(315,33,32,'2026-04-14 04:10:00','2026-04-14 04:12:00',9),(316,33,33,'2026-04-14 05:00:00','2026-04-14 05:02:00',10),(317,34,24,'2026-04-14 16:30:00','2026-04-14 16:32:00',1),(318,34,25,'2026-04-14 18:30:00','2026-04-14 18:32:00',2),(319,34,26,'2026-04-14 20:00:00','2026-04-14 20:02:00',3),(320,34,27,'2026-04-15 00:00:00','2026-04-15 00:02:00',4),(321,34,28,'2026-04-15 01:00:00','2026-04-15 01:02:00',5),(322,34,29,'2026-04-15 02:00:00','2026-04-15 02:02:00',6),(323,34,30,'2026-04-15 03:00:00','2026-04-15 03:02:00',7),(324,34,31,'2026-04-15 04:00:00','2026-04-15 04:02:00',8),(325,34,32,'2026-04-15 04:10:00','2026-04-15 04:12:00',9),(326,34,33,'2026-04-15 05:00:00','2026-04-15 05:02:00',10),(327,35,24,'2026-04-15 16:30:00','2026-04-15 16:32:00',1),(328,35,25,'2026-04-15 18:30:00','2026-04-15 18:32:00',2),(329,35,26,'2026-04-15 20:00:00','2026-04-15 20:02:00',3),(330,35,27,'2026-04-16 00:00:00','2026-04-16 00:02:00',4),(331,35,28,'2026-04-16 01:00:00','2026-04-16 01:02:00',5),(332,35,29,'2026-04-16 02:00:00','2026-04-16 02:02:00',6),(333,35,30,'2026-04-16 03:00:00','2026-04-16 03:02:00',7),(334,35,31,'2026-04-16 04:00:00','2026-04-16 04:02:00',8),(335,35,32,'2026-04-16 04:10:00','2026-04-16 04:12:00',9),(336,35,33,'2026-04-16 05:00:00','2026-04-16 05:02:00',10),(337,36,24,'2026-04-16 16:30:00','2026-04-16 16:32:00',1),(338,36,25,'2026-04-16 18:30:00','2026-04-16 18:32:00',2),(339,36,26,'2026-04-16 20:00:00','2026-04-16 20:02:00',3),(340,36,27,'2026-04-17 00:00:00','2026-04-17 00:02:00',4),(341,36,28,'2026-04-17 01:00:00','2026-04-17 01:02:00',5),(342,36,29,'2026-04-17 02:00:00','2026-04-17 02:02:00',6),(343,36,30,'2026-04-17 03:00:00','2026-04-17 03:02:00',7),(344,36,31,'2026-04-17 04:00:00','2026-04-17 04:02:00',8),(345,36,32,'2026-04-17 04:10:00','2026-04-17 04:12:00',9),(346,36,33,'2026-04-17 05:00:00','2026-04-17 05:02:00',10),(347,37,14,'2026-04-11 16:30:00','2026-04-11 16:32:00',1),(348,37,15,'2026-04-11 17:15:00','2026-04-11 17:17:00',2),(349,37,16,'2026-04-11 17:30:00','2026-04-11 17:32:00',3),(350,37,17,'2026-04-11 18:05:00','2026-04-11 18:07:00',4),(351,37,18,'2026-04-11 18:33:00','2026-04-11 18:35:00',5),(352,37,19,'2026-04-11 18:58:00','2026-04-11 19:00:00',6),(353,37,22,'2026-04-11 19:47:00','2026-04-11 19:49:00',7),(354,37,23,'2026-04-11 21:20:00','2026-04-11 21:22:00',8),(355,38,14,'2026-04-12 16:30:00','2026-04-12 16:32:00',1),(356,38,15,'2026-04-12 17:15:00','2026-04-12 17:17:00',2),(357,38,16,'2026-04-12 17:30:00','2026-04-12 17:32:00',3),(358,38,17,'2026-04-12 18:05:00','2026-04-12 18:07:00',4),(359,38,18,'2026-04-12 18:33:00','2026-04-12 18:35:00',5),(360,38,19,'2026-04-12 18:58:00','2026-04-12 19:00:00',6),(361,38,22,'2026-04-12 19:47:00','2026-04-12 19:49:00',7),(362,38,23,'2026-04-12 21:20:00','2026-04-12 21:22:00',8),(363,39,14,'2026-04-13 16:30:00','2026-04-13 16:32:00',1),(364,39,15,'2026-04-13 17:15:00','2026-04-13 17:17:00',2),(365,39,16,'2026-04-13 17:30:00','2026-04-13 17:32:00',3),(366,39,17,'2026-04-13 18:05:00','2026-04-13 18:07:00',4),(367,39,18,'2026-04-13 18:33:00','2026-04-13 18:35:00',5),(368,39,19,'2026-04-13 18:58:00','2026-04-13 19:00:00',6),(369,39,22,'2026-04-13 19:47:00','2026-04-13 19:49:00',7),(370,39,23,'2026-04-13 21:20:00','2026-04-13 21:22:00',8),(371,40,14,'2026-04-14 16:30:00','2026-04-14 16:32:00',1),(372,40,15,'2026-04-14 17:15:00','2026-04-14 17:17:00',2),(373,40,16,'2026-04-14 17:30:00','2026-04-14 17:32:00',3),(374,40,17,'2026-04-14 18:05:00','2026-04-14 18:07:00',4),(375,40,18,'2026-04-14 18:33:00','2026-04-14 18:35:00',5),(376,40,19,'2026-04-14 18:58:00','2026-04-14 19:00:00',6),(377,40,22,'2026-04-14 19:47:00','2026-04-14 19:49:00',7),(378,40,23,'2026-04-14 21:20:00','2026-04-14 21:22:00',8),(379,41,14,'2026-04-15 16:30:00','2026-04-15 16:32:00',1),(380,41,15,'2026-04-15 17:15:00','2026-04-15 17:17:00',2),(381,41,16,'2026-04-15 17:30:00','2026-04-15 17:32:00',3),(382,41,17,'2026-04-15 18:05:00','2026-04-15 18:07:00',4),(383,41,18,'2026-04-15 18:33:00','2026-04-15 18:35:00',5),(384,41,19,'2026-04-15 18:58:00','2026-04-15 19:00:00',6),(385,41,22,'2026-04-15 19:47:00','2026-04-15 19:49:00',7),(386,41,23,'2026-04-15 21:20:00','2026-04-15 21:22:00',8),(387,42,14,'2026-04-16 16:30:00','2026-04-16 16:32:00',1),(388,42,15,'2026-04-16 17:15:00','2026-04-16 17:17:00',2),(389,42,16,'2026-04-16 17:30:00','2026-04-16 17:32:00',3),(390,42,17,'2026-04-16 18:05:00','2026-04-16 18:07:00',4),(391,42,18,'2026-04-16 18:33:00','2026-04-16 18:35:00',5),(392,42,19,'2026-04-16 18:58:00','2026-04-16 19:00:00',6),(393,42,22,'2026-04-16 19:47:00','2026-04-16 19:49:00',7),(394,42,23,'2026-04-16 21:20:00','2026-04-16 21:22:00',8),(395,43,1,'2026-04-11 09:30:00','2026-04-11 09:32:00',1),(396,43,2,'2026-04-11 09:40:00','2026-04-11 09:42:00',2),(397,43,3,'2026-04-11 09:50:00','2026-04-11 09:52:00',3),(398,43,4,'2026-04-11 10:00:00','2026-04-11 10:02:00',4),(399,43,5,'2026-04-11 10:10:00','2026-04-11 10:12:00',5),(400,43,6,'2026-04-11 10:20:00','2026-04-11 10:22:00',6),(401,43,7,'2026-04-11 10:30:00','2026-04-11 10:32:00',7),(402,43,8,'2026-04-11 10:40:00','2026-04-11 10:42:00',8),(403,43,9,'2026-04-11 10:50:00','2026-04-11 10:52:00',9),(404,43,10,'2026-04-11 11:00:00','2026-04-11 11:02:00',10),(405,43,11,'2026-04-11 11:10:00','2026-04-11 11:12:00',11),(406,43,12,'2026-04-11 11:20:00','2026-04-11 11:22:00',12),(407,43,13,'2026-04-11 11:30:00','2026-04-11 11:32:00',13),(408,44,1,'2026-04-12 09:30:00','2026-04-12 09:32:00',1),(409,44,2,'2026-04-12 09:40:00','2026-04-12 09:42:00',2),(410,44,3,'2026-04-12 09:50:00','2026-04-12 09:52:00',3),(411,44,4,'2026-04-12 10:00:00','2026-04-12 10:02:00',4),(412,44,5,'2026-04-12 10:10:00','2026-04-12 10:12:00',5),(413,44,6,'2026-04-12 10:20:00','2026-04-12 10:22:00',6),(414,44,7,'2026-04-12 10:30:00','2026-04-12 10:32:00',7),(415,44,8,'2026-04-12 10:40:00','2026-04-12 10:42:00',8),(416,44,9,'2026-04-12 10:50:00','2026-04-12 10:52:00',9),(417,44,10,'2026-04-12 11:00:00','2026-04-12 11:02:00',10),(418,44,11,'2026-04-12 11:10:00','2026-04-12 11:12:00',11),(419,44,12,'2026-04-12 11:20:00','2026-04-12 11:22:00',12),(420,44,13,'2026-04-12 11:30:00','2026-04-12 11:32:00',13),(421,45,1,'2026-04-13 09:30:00','2026-04-13 09:32:00',1),(422,45,2,'2026-04-13 09:40:00','2026-04-13 09:42:00',2),(423,45,3,'2026-04-13 09:50:00','2026-04-13 09:52:00',3),(424,45,4,'2026-04-13 10:00:00','2026-04-13 10:02:00',4),(425,45,5,'2026-04-13 10:10:00','2026-04-13 10:12:00',5),(426,45,6,'2026-04-13 10:20:00','2026-04-13 10:22:00',6),(427,45,7,'2026-04-13 10:30:00','2026-04-13 10:32:00',7),(428,45,8,'2026-04-13 10:40:00','2026-04-13 10:42:00',8),(429,45,9,'2026-04-13 10:50:00','2026-04-13 10:52:00',9),(430,45,10,'2026-04-13 11:00:00','2026-04-13 11:02:00',10),(431,45,11,'2026-04-13 11:10:00','2026-04-13 11:12:00',11),(432,45,12,'2026-04-13 11:20:00','2026-04-13 11:22:00',12),(433,45,13,'2026-04-13 11:30:00','2026-04-13 11:32:00',13),(434,46,1,'2026-04-14 09:30:00','2026-04-14 09:32:00',1),(435,46,2,'2026-04-14 09:40:00','2026-04-14 09:42:00',2),(436,46,3,'2026-04-14 09:50:00','2026-04-14 09:52:00',3),(437,46,4,'2026-04-14 10:00:00','2026-04-14 10:02:00',4),(438,46,5,'2026-04-14 10:10:00','2026-04-14 10:12:00',5),(439,46,6,'2026-04-14 10:20:00','2026-04-14 10:22:00',6),(440,46,7,'2026-04-14 10:30:00','2026-04-14 10:32:00',7),(441,46,8,'2026-04-14 10:40:00','2026-04-14 10:42:00',8),(442,46,9,'2026-04-14 10:50:00','2026-04-14 10:52:00',9),(443,46,10,'2026-04-14 11:00:00','2026-04-14 11:02:00',10),(444,46,11,'2026-04-14 11:10:00','2026-04-14 11:12:00',11),(445,46,12,'2026-04-14 11:20:00','2026-04-14 11:22:00',12),(446,46,13,'2026-04-14 11:30:00','2026-04-14 11:32:00',13),(447,47,1,'2026-04-15 09:30:00','2026-04-15 09:32:00',1),(448,47,2,'2026-04-15 09:40:00','2026-04-15 09:42:00',2),(449,47,3,'2026-04-15 09:50:00','2026-04-15 09:52:00',3),(450,47,4,'2026-04-15 10:00:00','2026-04-15 10:02:00',4),(451,47,5,'2026-04-15 10:10:00','2026-04-15 10:12:00',5),(452,47,6,'2026-04-15 10:20:00','2026-04-15 10:22:00',6),(453,47,7,'2026-04-15 10:30:00','2026-04-15 10:32:00',7),(454,47,8,'2026-04-15 10:40:00','2026-04-15 10:42:00',8),(455,47,9,'2026-04-15 10:50:00','2026-04-15 10:52:00',9),(456,47,10,'2026-04-15 11:00:00','2026-04-15 11:02:00',10),(457,47,11,'2026-04-15 11:10:00','2026-04-15 11:12:00',11),(458,47,12,'2026-04-15 11:20:00','2026-04-15 11:22:00',12),(459,47,13,'2026-04-15 11:30:00','2026-04-15 11:32:00',13),(460,48,1,'2026-04-16 09:30:00','2026-04-16 09:32:00',1),(461,48,2,'2026-04-16 09:40:00','2026-04-16 09:42:00',2),(462,48,3,'2026-04-16 09:50:00','2026-04-16 09:52:00',3),(463,48,4,'2026-04-16 10:00:00','2026-04-16 10:02:00',4),(464,48,5,'2026-04-16 10:10:00','2026-04-16 10:12:00',5),(465,48,6,'2026-04-16 10:20:00','2026-04-16 10:22:00',6),(466,48,7,'2026-04-16 10:30:00','2026-04-16 10:32:00',7),(467,48,8,'2026-04-16 10:40:00','2026-04-16 10:42:00',8),(468,48,9,'2026-04-16 10:50:00','2026-04-16 10:52:00',9),(469,48,10,'2026-04-16 11:00:00','2026-04-16 11:02:00',10),(470,48,11,'2026-04-16 11:10:00','2026-04-16 11:12:00',11),(471,48,12,'2026-04-16 11:20:00','2026-04-16 11:22:00',12),(472,48,13,'2026-04-16 11:30:00','2026-04-16 11:32:00',13),(473,49,34,'2026-04-11 19:00:00','2026-04-11 19:02:00',1),(474,49,35,'2026-04-11 20:00:00','2026-04-11 20:02:00',2),(475,49,36,'2026-04-11 20:30:00','2026-04-11 20:32:00',3),(476,49,37,'2026-04-11 23:30:00','2026-04-11 23:32:00',4),(477,49,38,'2026-04-12 00:30:00','2026-04-12 00:32:00',5),(478,49,39,'2026-04-12 01:30:00','2026-04-12 01:32:00',6),(479,49,40,'2026-04-12 02:30:00','2026-04-12 02:32:00',7),(480,49,41,'2026-04-12 03:30:00','2026-04-12 03:32:00',8),(481,49,42,'2026-04-12 03:40:00','2026-04-12 03:42:00',9),(482,49,43,'2026-04-12 04:30:00','2026-04-12 04:32:00',10),(483,50,34,'2026-04-12 19:00:00','2026-04-12 19:02:00',1),(484,50,35,'2026-04-12 20:00:00','2026-04-12 20:02:00',2),(485,50,36,'2026-04-12 20:30:00','2026-04-12 20:32:00',3),(486,50,37,'2026-04-12 23:30:00','2026-04-12 23:32:00',4),(487,50,38,'2026-04-13 00:30:00','2026-04-13 00:32:00',5),(488,50,39,'2026-04-13 01:30:00','2026-04-13 01:32:00',6),(489,50,40,'2026-04-13 02:30:00','2026-04-13 02:32:00',7),(490,50,41,'2026-04-13 03:30:00','2026-04-13 03:32:00',8),(491,50,42,'2026-04-13 03:40:00','2026-04-13 03:42:00',9),(492,50,43,'2026-04-13 04:30:00','2026-04-13 04:32:00',10),(493,51,34,'2026-04-13 19:00:00','2026-04-13 19:02:00',1),(494,51,35,'2026-04-13 20:00:00','2026-04-13 20:02:00',2),(495,51,36,'2026-04-13 20:30:00','2026-04-13 20:32:00',3),(496,51,37,'2026-04-13 23:30:00','2026-04-13 23:32:00',4),(497,51,38,'2026-04-14 00:30:00','2026-04-14 00:32:00',5),(498,51,39,'2026-04-14 01:30:00','2026-04-14 01:32:00',6),(499,51,40,'2026-04-14 02:30:00','2026-04-14 02:32:00',7),(500,51,41,'2026-04-14 03:30:00','2026-04-14 03:32:00',8),(501,51,42,'2026-04-14 03:40:00','2026-04-14 03:42:00',9),(502,51,43,'2026-04-14 04:30:00','2026-04-14 04:32:00',10),(503,52,34,'2026-04-14 19:00:00','2026-04-14 19:02:00',1),(504,52,35,'2026-04-14 20:00:00','2026-04-14 20:02:00',2),(505,52,36,'2026-04-14 20:30:00','2026-04-14 20:32:00',3),(506,52,37,'2026-04-14 23:30:00','2026-04-14 23:32:00',4),(507,52,38,'2026-04-15 00:30:00','2026-04-15 00:32:00',5),(508,52,39,'2026-04-15 01:30:00','2026-04-15 01:32:00',6),(509,52,40,'2026-04-15 02:30:00','2026-04-15 02:32:00',7),(510,52,41,'2026-04-15 03:30:00','2026-04-15 03:32:00',8),(511,52,42,'2026-04-15 03:40:00','2026-04-15 03:42:00',9),(512,52,43,'2026-04-15 04:30:00','2026-04-15 04:32:00',10),(513,53,34,'2026-04-15 19:00:00','2026-04-15 19:02:00',1),(514,53,35,'2026-04-15 20:00:00','2026-04-15 20:02:00',2),(515,53,36,'2026-04-15 20:30:00','2026-04-15 20:32:00',3),(516,53,37,'2026-04-15 23:30:00','2026-04-15 23:32:00',4),(517,53,38,'2026-04-16 00:30:00','2026-04-16 00:32:00',5),(518,53,39,'2026-04-16 01:30:00','2026-04-16 01:32:00',6),(519,53,40,'2026-04-16 02:30:00','2026-04-16 02:32:00',7),(520,53,41,'2026-04-16 03:30:00','2026-04-16 03:32:00',8),(521,53,42,'2026-04-16 03:40:00','2026-04-16 03:42:00',9),(522,53,43,'2026-04-16 04:30:00','2026-04-16 04:32:00',10),(523,54,34,'2026-04-16 19:00:00','2026-04-16 19:02:00',1),(524,54,35,'2026-04-16 20:00:00','2026-04-16 20:02:00',2),(525,54,36,'2026-04-16 20:30:00','2026-04-16 20:32:00',3),(526,54,37,'2026-04-16 23:30:00','2026-04-16 23:32:00',4),(527,54,38,'2026-04-17 00:30:00','2026-04-17 00:32:00',5),(528,54,39,'2026-04-17 01:30:00','2026-04-17 01:32:00',6),(529,54,40,'2026-04-17 02:30:00','2026-04-17 02:32:00',7),(530,54,41,'2026-04-17 03:30:00','2026-04-17 03:32:00',8),(531,54,42,'2026-04-17 03:40:00','2026-04-17 03:42:00',9),(532,54,43,'2026-04-17 04:30:00','2026-04-17 04:32:00',10),(533,55,50,'2026-04-11 07:01:00','2026-04-11 07:03:00',1),(534,55,51,'2026-04-11 07:30:00','2026-04-11 07:32:00',2),(535,55,52,'2026-04-11 07:50:00','2026-04-11 07:52:00',3),(536,55,53,'2026-04-11 08:10:00','2026-04-11 08:12:00',4),(537,55,54,'2026-04-11 08:30:00','2026-04-11 08:32:00',5),(538,55,55,'2026-04-11 09:00:00','2026-04-11 09:02:00',6),(539,55,56,'2026-04-11 09:30:00','2026-04-11 09:32:00',7),(540,55,57,'2026-04-11 10:00:00','2026-04-11 10:02:00',8),(541,56,50,'2026-04-12 07:01:00','2026-04-12 07:03:00',1),(542,56,51,'2026-04-12 07:30:00','2026-04-12 07:32:00',2),(543,56,52,'2026-04-12 07:50:00','2026-04-12 07:52:00',3),(544,56,53,'2026-04-12 08:10:00','2026-04-12 08:12:00',4),(545,56,54,'2026-04-12 08:30:00','2026-04-12 08:32:00',5),(546,56,55,'2026-04-12 09:00:00','2026-04-12 09:02:00',6),(547,56,56,'2026-04-12 09:30:00','2026-04-12 09:32:00',7),(548,56,57,'2026-04-12 10:00:00','2026-04-12 10:02:00',8),(549,57,50,'2026-04-13 07:01:00','2026-04-13 07:03:00',1),(550,57,51,'2026-04-13 07:30:00','2026-04-13 07:32:00',2),(551,57,52,'2026-04-13 07:50:00','2026-04-13 07:52:00',3),(552,57,53,'2026-04-13 08:10:00','2026-04-13 08:12:00',4),(553,57,54,'2026-04-13 08:30:00','2026-04-13 08:32:00',5),(554,57,55,'2026-04-13 09:00:00','2026-04-13 09:02:00',6),(555,57,56,'2026-04-13 09:30:00','2026-04-13 09:32:00',7),(556,57,57,'2026-04-13 10:00:00','2026-04-13 10:02:00',8),(557,58,50,'2026-04-14 07:01:00','2026-04-14 07:03:00',1),(558,58,51,'2026-04-14 07:30:00','2026-04-14 07:32:00',2),(559,58,52,'2026-04-14 07:50:00','2026-04-14 07:52:00',3),(560,58,53,'2026-04-14 08:10:00','2026-04-14 08:12:00',4),(561,58,54,'2026-04-14 08:30:00','2026-04-14 08:32:00',5),(562,58,55,'2026-04-14 09:00:00','2026-04-14 09:02:00',6),(563,58,56,'2026-04-14 09:30:00','2026-04-14 09:32:00',7),(564,58,57,'2026-04-14 10:00:00','2026-04-14 10:02:00',8),(565,59,50,'2026-04-15 07:01:00','2026-04-15 07:03:00',1),(566,59,51,'2026-04-15 07:30:00','2026-04-15 07:32:00',2),(567,59,52,'2026-04-15 07:50:00','2026-04-15 07:52:00',3),(568,59,53,'2026-04-15 08:10:00','2026-04-15 08:12:00',4),(569,59,54,'2026-04-15 08:30:00','2026-04-15 08:32:00',5),(570,59,55,'2026-04-15 09:00:00','2026-04-15 09:02:00',6),(571,59,56,'2026-04-15 09:30:00','2026-04-15 09:32:00',7),(572,59,57,'2026-04-15 10:00:00','2026-04-15 10:02:00',8),(573,60,50,'2026-04-16 07:01:00','2026-04-16 07:03:00',1),(574,60,51,'2026-04-16 07:30:00','2026-04-16 07:32:00',2),(575,60,52,'2026-04-16 07:50:00','2026-04-16 07:52:00',3),(576,60,53,'2026-04-16 08:10:00','2026-04-16 08:12:00',4),(577,60,54,'2026-04-16 08:30:00','2026-04-16 08:32:00',5),(578,60,55,'2026-04-16 09:00:00','2026-04-16 09:02:00',6),(579,60,56,'2026-04-16 09:30:00','2026-04-16 09:32:00',7),(580,60,57,'2026-04-16 10:00:00','2026-04-16 10:02:00',8);
/*!40000 ALTER TABLE `stop_times` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stops`
--

DROP TABLE IF EXISTS `stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lat` decimal(10,7) NOT NULL,
  `lng` decimal(10,7) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seq` int NOT NULL,
  `route_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKj89bt622wq57q3hmubkjgu6il` (`route_id`),
  CONSTRAINT `FKj89bt622wq57q3hmubkjgu6il` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stops`
--

LOCK TABLES `stops` WRITE;
/*!40000 ALTER TABLE `stops` DISABLE KEYS */;
INSERT INTO `stops` VALUES (1,30.2892662,77.9985028,'Dehradun',1,1),(2,30.1967000,78.0876500,'Fatehpur Border (UT)',2,1),(3,30.8640965,77.8887439,'Fatehpur Border (Up)',3,1),(4,30.2398944,77.9590923,'Datmandir',4,1),(5,30.1782233,77.9051337,'Mohand',5,1),(6,30.0469500,77.7640000,'Biharigarh',6,1),(7,30.0321000,77.7533000,'Chhutmalpur',7,1),(8,30.0173055,77.7588179,'Jairampur Border (UP)',8,1),(9,30.0095719,77.7624924,'Jairampur Border (UT)',9,1),(10,30.0694000,77.8400000,'Bhagwanpur',10,1),(11,29.8663000,77.8912000,'Roorkee',11,1),(12,29.9455193,78.1535851,'Haridwar',12,1),(13,30.1129952,78.2955996,'Rishikesh',13,1),(14,30.2892662,77.9972830,'Dehradun',1,2),(15,30.0848687,77.9009667,'Buggawala',2,2),(16,29.9371672,77.8304471,'Bhagwanpur',3,2),(17,29.8107282,77.7700758,'Jabarhera',4,2),(18,29.7035087,77.7196284,'Deoband ',5,2),(19,29.5942345,77.6677557,'Thamana',6,2),(20,29.3523160,77.5530817,'Shahpur',7,2),(21,28.8797893,77.3301133,'Badagaon',8,2),(22,28.7753859,77.2809629,'Pavi Sadakpur',9,2),(23,28.6688016,77.2308832,' Kashmeri Gate',10,2),(24,25.5546738,84.6724262,'Ara',1,3),(25,25.2224908,84.2626476,'Bikramganj',2,3),(26,24.9539160,84.0141642,'Sasaram',3,3),(27,24.7487797,84.3805968,'Aurangabad',4,3),(28,24.3057763,85.4170134,'Barhi',5,3),(29,23.9912734,85.3506846,'Hazaribagh',6,3),(30,23.6322842,85.5109706,'Ramgarh',7,3),(31,85.3088813,85.3088813,'Ranchi',8,3),(32,22.9385679,86.0494959,'Chandil',9,3),(33,22.8157607,86.2115739,'Mango',10,3),(34,22.8157607,86.2115739,'Tata',1,4),(35,22.9385679,86.0494959,'Chandil',2,4),(36,85.3088813,85.3088813,'Ranchi',3,4),(37,23.6322842,85.5109706,'Ramgarh',4,4),(38,23.9912734,85.3506846,'Hazaribagh',5,4),(39,24.3057763,85.4170134,'Barhi',6,4),(40,24.7487797,84.3805968,'Aurangabad',7,4),(41,24.9539160,84.0141642,'Sasaram',8,4),(42,25.2224908,84.2626476,'Bikramganj',9,4),(43,25.5546738,84.6724262,'Ara',10,4),(44,28.6138444,77.2082486,'Delhi',1,5),(45,27.4924928,77.6728853,'Mathura',2,5),(46,22.3499361,73.1699580,'Varodara',3,5),(47,19.0231737,72.7920702,'Mumbai',4,5),(48,30.1129952,78.2955996,'Rishikesh',1,7),(49,30.2892662,77.9985028,'Dehradun',2,7),(50,28.6673000,77.2273000,'New Delhi',1,8),(51,28.6692000,77.4538000,'Ghaziabad',2,8),(52,28.7306000,77.7800000,'Hapur',3,8),(53,28.8457000,78.2361000,'Gajraula',4,8),(54,28.8386000,78.7733000,'Moradabad',5,8),(55,28.8153000,79.0250000,'Rampur',6,8),(56,28.9800000,79.4000000,'Rudrapur',7,8),(57,29.2225000,79.5286000,'Haldwani',8,8);
/*!40000 ALTER TABLE `stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `route_id` bigint NOT NULL,
  `bus_id` bigint NOT NULL,
  `departure_datetime` datetime NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  PRIMARY KEY (`id`),
  KEY `fk_trips_bus` (`bus_id`),
  KEY `route_id` (`route_id`,`departure_datetime`),
  CONSTRAINT `fk_trips_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`),
  CONSTRAINT `fk_trips_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
INSERT INTO `trips` VALUES (5,5,5,'2025-11-26 19:30:00','scheduled'),(9,7,7,'2026-04-10 16:30:00','scheduled'),(10,7,7,'2026-04-10 16:30:00','scheduled'),(12,8,8,'2026-04-11 16:07:00','scheduled'),(13,2,2,'2026-04-11 02:53:00','scheduled'),(14,1,1,'2026-04-10 19:00:00','scheduled'),(17,3,10,'2026-04-11 18:22:00','scheduled'),(18,4,4,'2026-04-11 19:00:00','scheduled'),(19,3,10,'2026-04-12 18:22:00','scheduled'),(20,3,10,'2026-04-13 18:22:00','scheduled'),(21,3,10,'2026-04-14 18:22:00','scheduled'),(22,3,10,'2026-04-15 18:22:00','scheduled'),(23,3,10,'2026-04-16 18:22:00','scheduled'),(24,3,10,'2026-04-17 18:22:00','scheduled'),(25,3,10,'2026-04-18 18:22:00','scheduled'),(26,3,10,'2026-04-19 18:22:00','scheduled'),(27,3,10,'2026-04-20 18:22:00','scheduled'),(28,3,10,'2026-04-21 18:22:00','scheduled'),(29,3,10,'2026-04-22 18:22:00','scheduled'),(30,3,10,'2026-04-23 18:22:00','scheduled'),(31,3,3,'2026-04-11 16:30:00','scheduled'),(32,3,3,'2026-04-12 16:30:00','scheduled'),(33,3,3,'2026-04-13 16:30:00','scheduled'),(34,3,3,'2026-04-14 16:30:00','scheduled'),(35,3,3,'2026-04-15 16:30:00','scheduled'),(36,3,3,'2026-04-16 16:30:00','scheduled'),(37,2,2,'2026-04-11 16:30:00','scheduled'),(38,2,2,'2026-04-12 16:30:00','scheduled'),(39,2,2,'2026-04-13 16:30:00','scheduled'),(40,2,2,'2026-04-14 16:30:00','scheduled'),(41,2,2,'2026-04-15 16:30:00','scheduled'),(42,2,2,'2026-04-16 16:30:00','scheduled'),(43,1,1,'2026-04-11 09:30:00','scheduled'),(44,1,1,'2026-04-12 09:30:00','scheduled'),(45,1,1,'2026-04-13 09:30:00','scheduled'),(46,1,1,'2026-04-14 09:30:00','scheduled'),(47,1,1,'2026-04-15 09:30:00','scheduled'),(48,1,1,'2026-04-16 09:30:00','scheduled'),(49,4,4,'2026-04-11 19:00:00','scheduled'),(50,4,4,'2026-04-12 19:00:00','scheduled'),(51,4,4,'2026-04-13 19:00:00','scheduled'),(52,4,4,'2026-04-14 19:00:00','scheduled'),(53,4,4,'2026-04-15 19:00:00','scheduled'),(54,4,4,'2026-04-16 19:00:00','scheduled'),(55,8,8,'2026-04-11 07:00:00','scheduled'),(56,8,8,'2026-04-12 07:00:00','scheduled'),(57,8,8,'2026-04-13 07:00:00','scheduled'),(58,8,8,'2026-04-14 07:00:00','scheduled'),(59,8,8,'2026-04-15 07:00:00','scheduled'),(60,8,8,'2026-04-16 07:00:00','scheduled'),(61,5,5,'2026-04-11 08:15:00','scheduled'),(62,5,5,'2026-04-12 08:15:00','scheduled'),(63,5,5,'2026-04-13 08:15:00','scheduled'),(64,5,5,'2026-04-14 08:15:00','scheduled'),(65,5,5,'2026-04-15 08:15:00','scheduled'),(66,5,5,'2026-04-16 08:15:00','scheduled'),(67,7,7,'2026-04-11 09:40:00','scheduled'),(68,7,7,'2026-04-12 09:40:00','scheduled'),(69,7,7,'2026-04-13 09:40:00','scheduled'),(70,7,7,'2026-04-14 09:40:00','scheduled'),(71,7,7,'2026-04-15 09:40:00','scheduled'),(72,7,7,'2026-04-16 09:40:00','scheduled');
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-12  4:00:26
