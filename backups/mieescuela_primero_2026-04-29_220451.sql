-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mieescuela_primero
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_usuario`
--

DROP TABLE IF EXISTS `admin_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_usuario` (
  `id_admin` int NOT NULL AUTO_INCREMENT,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) DEFAULT NULL,
  `rol` varchar(30) DEFAULT 'admin',
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_usuario`
--

/*!40000 ALTER TABLE `admin_usuario` DISABLE KEYS */;
INSERT INTO `admin_usuario` VALUES (1,'admin@miescuela.org','admin123','Administrador Principal','super_admin');
/*!40000 ALTER TABLE `admin_usuario` ENABLE KEYS */;

--
-- Table structure for table `escuela`
--

DROP TABLE IF EXISTS `escuela`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escuela` (
  `id_escuela` char(36) NOT NULL DEFAULT (uuid()),
  `nombre` varchar(150) NOT NULL,
  `id_municipio` int NOT NULL,
  `id_nivel` int DEFAULT NULL,
  `num_estudiantes` int DEFAULT '0',
  `num_maestros` int DEFAULT '0',
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text,
  `descripcion` text,
  `url_imagen` text,
  `progreso_financiamiento` int DEFAULT '0',
  `progreso_materiales` int DEFAULT '0',
  `progreso_voluntariado` int DEFAULT '0',
  `nivel_condicion` enum('Ideal','Alto','Medio','Básico','Mínimo') DEFAULT 'Mínimo',
  PRIMARY KEY (`id_escuela`),
  UNIQUE KEY `unique_nombre_municipio` (`nombre`,`id_municipio`),
  KEY `id_municipio` (`id_municipio`),
  KEY `id_nivel` (`id_nivel`),
  CONSTRAINT `escuela_ibfk_1` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE RESTRICT,
  CONSTRAINT `escuela_ibfk_2` FOREIGN KEY (`id_nivel`) REFERENCES `nivel_educativo` (`id_nivel`) ON DELETE SET NULL,
  CONSTRAINT `escuela_chk_1` CHECK ((`progreso_financiamiento` between 0 and 100)),
  CONSTRAINT `escuela_chk_2` CHECK ((`progreso_materiales` between 0 and 100)),
  CONSTRAINT `escuela_chk_3` CHECK ((`progreso_voluntariado` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escuela`
--

/*!40000 ALTER TABLE `escuela` DISABLE KEYS */;
INSERT INTO `escuela` VALUES ('023721c7-610c-4619-a3c7-8d00a5daa785','Las Mesitas',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('030bfaa5-08cb-4cd0-818a-36fed1460730','Lázaro Cárdenas',21,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00','Carlos de Icaza',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('073746f6-5fb4-400a-a702-ac33768e7438','La Reserva',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96','Miguel Hidalgo y Costilla',3,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('501edeac-fd54-42fa-aa7d-49ce343e7c22','Justo Sierra',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58','Manuel M Cerna',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('6d083ea4-c54a-48af-939a-9e5d2d47d95d','Los Aguirre',3,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7','Margarita Maza de Juárez',1,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('b29c4aa8-3066-4238-a448-e59989276a5e','Urbana 1098',21,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa','Antonio de Caso Peralta',21,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo'),('f8867835-eb0a-4c98-824f-3207b24d98d8','Francisco Rojas',2,NULL,0,0,NULL,NULL,NULL,'Importado desde Excel',NULL,0,0,0,'Mínimo');
/*!40000 ALTER TABLE `escuela` ENABLE KEYS */;

--
-- Table structure for table `escuela_necesidad`
--

DROP TABLE IF EXISTS `escuela_necesidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escuela_necesidad` (
  `id_escuela` char(36) NOT NULL,
  `id_necesidad` int NOT NULL,
  PRIMARY KEY (`id_escuela`,`id_necesidad`),
  KEY `id_necesidad` (`id_necesidad`),
  CONSTRAINT `escuela_necesidad_ibfk_1` FOREIGN KEY (`id_escuela`) REFERENCES `escuela` (`id_escuela`) ON DELETE CASCADE,
  CONSTRAINT `escuela_necesidad_ibfk_2` FOREIGN KEY (`id_necesidad`) REFERENCES `necesidad_catalogo` (`id_necesidad`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escuela_necesidad`
--

/*!40000 ALTER TABLE `escuela_necesidad` DISABLE KEYS */;
INSERT INTO `escuela_necesidad` VALUES ('030bfaa5-08cb-4cd0-818a-36fed1460730',29),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',29),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',29),('501edeac-fd54-42fa-aa7d-49ce343e7c22',29),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',29),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',29),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa',29),('f8867835-eb0a-4c98-824f-3207b24d98d8',29),('023721c7-610c-4619-a3c7-8d00a5daa785',30),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',30),('073746f6-5fb4-400a-a702-ac33768e7438',30),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',30),('501edeac-fd54-42fa-aa7d-49ce343e7c22',30),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',30),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',30),('b29c4aa8-3066-4238-a448-e59989276a5e',30),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa',30),('f8867835-eb0a-4c98-824f-3207b24d98d8',30),('030bfaa5-08cb-4cd0-818a-36fed1460730',31),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',31),('073746f6-5fb4-400a-a702-ac33768e7438',31),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',31),('501edeac-fd54-42fa-aa7d-49ce343e7c22',31),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',31),('b29c4aa8-3066-4238-a448-e59989276a5e',31),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa',31),('f8867835-eb0a-4c98-824f-3207b24d98d8',31),('030bfaa5-08cb-4cd0-818a-36fed1460730',32),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',32),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',32),('501edeac-fd54-42fa-aa7d-49ce343e7c22',32),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',32),('b29c4aa8-3066-4238-a448-e59989276a5e',32),('f8867835-eb0a-4c98-824f-3207b24d98d8',32),('023721c7-610c-4619-a3c7-8d00a5daa785',33),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',33),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',33),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',33),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',33),('023721c7-610c-4619-a3c7-8d00a5daa785',34),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',34),('073746f6-5fb4-400a-a702-ac33768e7438',34),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',34),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',34),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',34),('f8867835-eb0a-4c98-824f-3207b24d98d8',34),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',35),('023721c7-610c-4619-a3c7-8d00a5daa785',36),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',36),('073746f6-5fb4-400a-a702-ac33768e7438',36),('501edeac-fd54-42fa-aa7d-49ce343e7c22',36),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',36),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',36),('023721c7-610c-4619-a3c7-8d00a5daa785',37),('030bfaa5-08cb-4cd0-818a-36fed1460730',37),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',37),('073746f6-5fb4-400a-a702-ac33768e7438',37),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',37),('501edeac-fd54-42fa-aa7d-49ce343e7c22',37),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',37),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',37),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',37),('b29c4aa8-3066-4238-a448-e59989276a5e',37),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa',37),('f8867835-eb0a-4c98-824f-3207b24d98d8',37),('023721c7-610c-4619-a3c7-8d00a5daa785',38),('030bfaa5-08cb-4cd0-818a-36fed1460730',38),('073746f6-5fb4-400a-a702-ac33768e7438',38),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',38),('501edeac-fd54-42fa-aa7d-49ce343e7c22',38),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',38),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',38),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',38),('b29c4aa8-3066-4238-a448-e59989276a5e',38),('030bfaa5-08cb-4cd0-818a-36fed1460730',41),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',41),('073746f6-5fb4-400a-a702-ac33768e7438',41),('501edeac-fd54-42fa-aa7d-49ce343e7c22',41),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',41),('023721c7-610c-4619-a3c7-8d00a5daa785',42),('030bfaa5-08cb-4cd0-818a-36fed1460730',42),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',42),('073746f6-5fb4-400a-a702-ac33768e7438',42),('501edeac-fd54-42fa-aa7d-49ce343e7c22',42),('6d083ea4-c54a-48af-939a-9e5d2d47d95d',42),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',42),('b29c4aa8-3066-4238-a448-e59989276a5e',42),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',43),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',43),('b29c4aa8-3066-4238-a448-e59989276a5e',43),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',44),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',45),('1e3b09ee-3059-440c-9b7f-dc9cb64a7d96',45),('030bfaa5-08cb-4cd0-818a-36fed1460730',46),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',46),('073746f6-5fb4-400a-a702-ac33768e7438',46),('501edeac-fd54-42fa-aa7d-49ce343e7c22',46),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',46),('c9bf47e0-88ce-4b55-bd8d-784f6b60adaa',46),('030bfaa5-08cb-4cd0-818a-36fed1460730',47),('b29c4aa8-3066-4238-a448-e59989276a5e',47),('b29c4aa8-3066-4238-a448-e59989276a5e',48),('05b9e2fb-9fc6-4528-ab3b-976f9c134f00',49),('073746f6-5fb4-400a-a702-ac33768e7438',49),('023721c7-610c-4619-a3c7-8d00a5daa785',50),('073746f6-5fb4-400a-a702-ac33768e7438',50),('501edeac-fd54-42fa-aa7d-49ce343e7c22',50),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',50),('6e4c6ff5-6ef5-4ebd-a156-8644707cb7b7',50),('023721c7-610c-4619-a3c7-8d00a5daa785',51),('6c0e3c38-5046-40cd-925a-e0d5f44d6e58',51);
/*!40000 ALTER TABLE `escuela_necesidad` ENABLE KEYS */;

--
-- Table structure for table `escuela_tipo_donacion`
--

DROP TABLE IF EXISTS `escuela_tipo_donacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escuela_tipo_donacion` (
  `id_escuela` char(36) NOT NULL,
  `id_tipo_donacion` int NOT NULL,
  PRIMARY KEY (`id_escuela`,`id_tipo_donacion`),
  KEY `id_tipo_donacion` (`id_tipo_donacion`),
  CONSTRAINT `escuela_tipo_donacion_ibfk_1` FOREIGN KEY (`id_escuela`) REFERENCES `escuela` (`id_escuela`) ON DELETE CASCADE,
  CONSTRAINT `escuela_tipo_donacion_ibfk_2` FOREIGN KEY (`id_tipo_donacion`) REFERENCES `tipo_donacion` (`id_tipo_donacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escuela_tipo_donacion`
--

/*!40000 ALTER TABLE `escuela_tipo_donacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `escuela_tipo_donacion` ENABLE KEYS */;

--
-- Table structure for table `municipio`
--

DROP TABLE IF EXISTS `municipio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `municipio` (
  `id_municipio` int NOT NULL AUTO_INCREMENT,
  `nombre_municipio` varchar(80) NOT NULL,
  `estado` varchar(50) DEFAULT 'Jalisco',
  PRIMARY KEY (`id_municipio`),
  UNIQUE KEY `nombre_municipio` (`nombre_municipio`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `municipio`
--

/*!40000 ALTER TABLE `municipio` DISABLE KEYS */;
INSERT INTO `municipio` VALUES (1,'Zapopan','Jalisco'),(2,'Arandas','Jalisco'),(3,'San Juan de los Lagos','Jalisco'),(4,'Tlaquepaque','Jalisco'),(5,'Guadalajara','Jalisco'),(6,'Tlajomulco de Zúñiga','Jalisco'),(7,'El Salto','Jalisco'),(8,'Puerto Vallarta','Jalisco'),(17,'Lagos de Moreno','Jalisco'),(18,'Jalostotitlán','Jalisco'),(19,'San Miguel el Alto','Jalisco'),(20,'Tepatitlán de Morelos','Jalisco'),(21,'San Pedro Tlaquepaque','Jalisco');
/*!40000 ALTER TABLE `municipio` ENABLE KEYS */;

--
-- Table structure for table `necesidad_catalogo`
--

DROP TABLE IF EXISTS `necesidad_catalogo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `necesidad_catalogo` (
  `id_necesidad` int NOT NULL AUTO_INCREMENT,
  `nombre_necesidad` varchar(100) NOT NULL,
  `categoria_general` varchar(60) DEFAULT NULL,
  `cantidad_requerida` int DEFAULT '0',
  `cantidad_recibida` int DEFAULT '0',
  `prioridad` enum('alta','media','baja') DEFAULT 'media',
  `propuesta` text,
  `unidad` varchar(30) DEFAULT NULL,
  `estado` varchar(30) DEFAULT 'Pendiente',
  `detalles` text,
  PRIMARY KEY (`id_necesidad`),
  UNIQUE KEY `nombre_necesidad` (`nombre_necesidad`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `necesidad_catalogo`
--

/*!40000 ALTER TABLE `necesidad_catalogo` DISABLE KEYS */;
INSERT INTO `necesidad_catalogo` VALUES (1,'Libros','Material educativo',200,45,'alta',NULL,NULL,'Pendiente',NULL),(2,'Computadoras','Tecnología',30,5,'alta',NULL,NULL,'Pendiente',NULL),(3,'Útiles Escolares','Material educativo',500,120,'media',NULL,NULL,'Pendiente',NULL),(4,'Infraestructura','Infraestructura',1,0,'alta',NULL,NULL,'Pendiente',NULL),(5,'Tecnología','Tecnología',20,8,'media',NULL,NULL,'Pendiente',NULL),(6,'Equipo Deportivo','Deporte',50,10,'baja',NULL,NULL,'Pendiente',NULL),(7,'Materiales de Arte','Cultural',100,20,'media',NULL,NULL,'Pendiente',NULL),(8,'Biblioteca','Material educativo',1,0,'alta',NULL,NULL,'Pendiente',NULL),(9,'Laboratorio de Ciencias','Infraestructura',1,0,'media',NULL,NULL,'Pendiente',NULL),(10,'Instrumentos Musicales','Cultural',15,2,'baja',NULL,NULL,'Pendiente',NULL),(11,'Tablets','Tecnología',40,6,'alta',NULL,NULL,'Pendiente',NULL),(12,'Proyectores','Tecnología',10,1,'media',NULL,NULL,'Pendiente',NULL),(13,'Herramientas de Jardinería','Acceso',20,5,'baja',NULL,NULL,'Pendiente',NULL),(14,'Semillas','Medio ambiente',100,30,'media',NULL,NULL,'Pendiente',NULL),(29,'Pizarrones / pintarrones','Material',21,0,'media','Pizarrones','Pieza','Aun no cubierto',NULL),(30,'Construcción materiales','Material',46143,0,'media','Pintura para barandales','Servicio','Cubierto','Metro para cada salón (4 salones)'),(31,'Formación para docentes','Formación',46145,0,'media','Docentes: primeros auxilios (2)','Horas','Aun no cubierto','Sesión de 2-4 horas, para familias y docentes (aprox. 15 personas)'),(32,'Formación para familias','Formación',24,0,'media','Familias: crianza positiva (continuidad)','Horas','Cubierto','Sesión de 1 hora con cada grupo (15 grupos)'),(33,'Material de papelería','Material',300,0,'media','Marcadores para pizarrón','Paquete','Cubierto parcialmente','Paquetes de 100'),(34,'Material de educación física','Material',100,0,'media','Balones y bombas, redes de porterías','Servicio','Cubierto','Paquetes de 20'),(35,'Material - construcción','Infraestructura',4,0,'media','Grava de 7 metros cúbicos','Viajes','Aun no cubierto',NULL),(36,'Salud física','Salud',30,0,'media','Jornadas de salud física','Servicio','Cubierto','Paquetes de 8'),(37,'Formación para estudiantes','Formación',33,0,'media','Psicóloga: manejo de emociones (focalizado','Horas','Cubierto','S: secundaria'),(38,'Mobiliario','Material',16,0,'media','Bodegas montables (para clases abajo, sino revisar)','Piezas','Aun no cubierto','Similar a mesa de picnic'),(39,'Salud emocional','Salud',27,0,'media','Atención psicológica grupal','Paquete','Cubierto parcialmente',NULL),(40,'Mantenimiento','Infraestructura',29,0,'media','Impermeabilizante','Piezas','Cubierto parcialmente',NULL),(41,'Material literario','Material',100,0,'media','Libros informativos (enciclopedias)','Piezas','Aun no cubierto',NULL),(42,'Material didáctico','Material',30,0,'media','Juegos de mesa','Pieza','Aun no cubierto',NULL),(43,'Material de aseo','Material',5,0,'media','Botes de basura para interior','Piezas','Aun no cubierto',NULL),(44,'Salud material','Salud',1,0,'media','Silla de ruedas/andadera','Piezas','Cubierto',NULL),(45,'Salud psicológica','Salud',30,0,'media','Psicóloga: diagnóstico de BAP y violencia','Horas','Aun no cubierto',NULL),(46,'Material tecnológico','Material',5,0,'media','Laptops para el personal','Piezas','Aun no cubierto','Para televisores de 55 pulgadas'),(47,'Visita extraescolar educativa','Formación',12,0,'media','Transporte para visita extraescolar','Camiones','Aun no cubierto',NULL),(48,'Servicio de mantenimiento','Material',2,0,'media','Fumigación en canchas y jardines','Servicio','Cubierto',NULL),(49,'Transporte','Material',30,0,'media','Bicicletas','Piezas','Cubierto',NULL),(50,'Construcción servicio','Infraestructura',4,0,'media','Arreglo de barda con alambrado caído','Servicio','Cubierto','61 azulejos de diferente medida'),(51,'Servicio tecnológico','Material',8,0,'media','Arreglo de sonido de internet','Servicio','Aun no cubierto',NULL);
/*!40000 ALTER TABLE `necesidad_catalogo` ENABLE KEYS */;

--
-- Table structure for table `nivel_educativo`
--

DROP TABLE IF EXISTS `nivel_educativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nivel_educativo` (
  `id_nivel` int NOT NULL AUTO_INCREMENT,
  `nombre_nivel` varchar(40) NOT NULL,
  PRIMARY KEY (`id_nivel`),
  UNIQUE KEY `nombre_nivel` (`nombre_nivel`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nivel_educativo`
--

/*!40000 ALTER TABLE `nivel_educativo` DISABLE KEYS */;
INSERT INTO `nivel_educativo` VALUES (1,'Preescolar'),(5,'Preparatoria'),(2,'Primaria'),(3,'Secundaria');
/*!40000 ALTER TABLE `nivel_educativo` ENABLE KEYS */;

--
-- Table structure for table `solicitud_apoyo`
--

DROP TABLE IF EXISTS `solicitud_apoyo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_apoyo` (
  `id_solicitud` char(36) NOT NULL DEFAULT (uuid()),
  `nombre_contacto` varchar(100) NOT NULL,
  `institucion` varchar(150) DEFAULT NULL,
  `id_municipio` int DEFAULT NULL,
  `tipo_institucion` varchar(80) DEFAULT NULL,
  `forma_participacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `notas_adicionales` text,
  `fecha_recepcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_escuela_interes` char(36) DEFAULT NULL,
  `categoria_interes` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `id_municipio` (`id_municipio`),
  KEY `id_escuela_interes` (`id_escuela_interes`),
  CONSTRAINT `solicitud_apoyo_ibfk_1` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE SET NULL,
  CONSTRAINT `solicitud_apoyo_ibfk_2` FOREIGN KEY (`id_escuela_interes`) REFERENCES `escuela` (`id_escuela`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_apoyo`
--

/*!40000 ALTER TABLE `solicitud_apoyo` DISABLE KEYS */;
INSERT INTO `solicitud_apoyo` VALUES ('0d5ccb2e-b623-45e1-9c43-34bb2242c488','Andres','tec',1,'Academia (universidad, educación media superior)','Como aliado/a (apoyar a la escuela a solventar sus necesidades)','3326082303','a01647264@tec.mx','','2026-04-29 03:19:50',NULL,NULL);
/*!40000 ALTER TABLE `solicitud_apoyo` ENABLE KEYS */;

--
-- Table structure for table `tipo_donacion`
--

DROP TABLE IF EXISTS `tipo_donacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_donacion` (
  `id_tipo_donacion` int NOT NULL AUTO_INCREMENT,
  `nombre_tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`id_tipo_donacion`),
  UNIQUE KEY `nombre_tipo` (`nombre_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_donacion`
--

/*!40000 ALTER TABLE `tipo_donacion` DISABLE KEYS */;
INSERT INTO `tipo_donacion` VALUES (1,'Económica'),(2,'En especie'),(4,'Talleres'),(5,'Vinculación'),(3,'Voluntariado');
/*!40000 ALTER TABLE `tipo_donacion` ENABLE KEYS */;

--
-- Dumping routines for database 'mieescuela_primero'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-29 22:05:18
