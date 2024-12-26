import React, {useState } from 'react';
import { Card, Table, Button } from 'antd';
import CalibrationCard from './cards/CalibrationCard';
import { Filter } from 'lucide-react';

const toolsData = [
  { slNo: '1', instrumentCode: 'L02-8011', size: '6.00 - 8.00', equipmentNo: '1023510', maintaincePlan: '26863', notificationNumber: '8000263747', calibrationDate: '19-04-2024', calibrationDueDate: '26-12-2024', remarks: 'CALIBRATED', location: 'C2_R3', other: 'Yes', description:'' },
  { slNo: '2', instrumentCode: 'L02-8087', size: '7.01 - 8.50', equipmentNo: '1023511', maintaincePlan: '26864', notificationNumber: '8000298478', calibrationDate: '19-04-2024', calibrationDueDate: '30-12-2024', remarks: 'CALIBRATED', location: 'C2_R3', other: '', description:'Naveen Kumar,218477' },
  { slNo: '3', instrumentCode: 'L02-8094', size: '3.60 - 4.03', equipmentNo: '1027213', maintaincePlan: '32622', notificationNumber: '8000298500', calibrationDate: '19-04-2024', calibrationDueDate: '25-01-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '4', instrumentCode: 'L02-8095', size: '3.90 - 4.03', equipmentNo: '1023509', maintaincePlan: '26862', notificationNumber: '8000298501', calibrationDate: '19-04-2024', calibrationDueDate: '18-04-2026', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '5', instrumentCode: 'L02-8096', size: '4.60 - 5.03', equipmentNo: '1023196', maintaincePlan: '26549', notificationNumber: '8000298504', calibrationDate: '19-04-2024', calibrationDueDate: '18-04-2026', remarks: 'CALIBRATED', location: 'C2_R2', other: '', description:'' },
  { slNo: '6', instrumentCode: 'L02-8106', size: '17.01 - 17.5', equipmentNo: '1023248', maintaincePlan: '26601', notificationNumber: '8000298505', calibrationDate: '19-04-2024', calibrationDueDate: '18-04-2026', remarks: 'CALIBRATED', location: 'C3_R4', other: 'Issued', description:'CHANDRASHEKAR 209781/28/10/24' },
  { slNo: '7', instrumentCode: 'L02-8108', size: '10.01 - 11.00', equipmentNo: '1022823', maintaincePlan: '26176', notificationNumber: '8000298506', calibrationDate: '19-04-2024', calibrationDueDate: '18-04-2026', remarks: 'CALIBRATED', location: 'C3_R1', other: 'Yes', description:'' },
  { slNo: '8', instrumentCode: 'L02-8140', size: '3.76-4.00', equipmentNo: '1023458', maintaincePlan: '26811', notificationNumber: '80000298507', calibrationDate: '19-04-2024', calibrationDueDate: '18-04-2026', remarks: 'CALIBRATED', location: 'C1_R2', other: '', description:'' },
  { slNo: '9', instrumentCode: 'L02-8124', size: '1.76-2.00', equipmentNo: '1023457', maintaincePlan: '26810', notificationNumber: '8000296805', calibrationDate: '12-03-2024', calibrationDueDate: '11-03-2026', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '10', instrumentCode: 'L02-8160', size: '0.5-2.0', equipmentNo: '1063618', maintaincePlan: '120182', notificationNumber: '8000288113', calibrationDate: '12-03-2024', calibrationDueDate: '11-03-2026', remarks: 'CALIBRATED', location: 'C1_R5', other: 'Issued ', description:'GIRISHA 215804/04/09/24' },
  { slNo: '11', instrumentCode: 'L02-8161', size: '2.0-4.0', equipmentNo: '1063619', maintaincePlan: '120183', notificationNumber: '8000288115', calibrationDate: '12-03-2024', calibrationDueDate: '11-03-2026', remarks: 'CALIBRATED', location: 'C1_R5', other: 'Yes', description:'' },
  { slNo: '12', instrumentCode: 'L02-8162', size: '4.0-6.0', equipmentNo: '1063620', maintaincePlan: '120184', notificationNumber: '8000288116', calibrationDate: '12-03-2024', calibrationDueDate: '11-03-2026', remarks: 'CALIBRATED', location: 'C1_R5', other: 'Yes', description:'' },
  { slNo: '13', instrumentCode: 'L02-8151', size: '5.01-5.25', equipmentNo: '1023452', maintaincePlan: '26805', notificationNumber: '8000296804', calibrationDate: '12-03-2024', calibrationDueDate: '11-03-2026', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '14', instrumentCode: 'L02-8129', size: '2.26 - 2.50', equipmentNo: '1023447', maintaincePlan: '26800', notificationNumber: '8000283951', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '15', instrumentCode: 'L02-8130', size: '2.51-2.75', equipmentNo: '1023449', maintaincePlan: '26802', notificationNumber: '8000283952', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '16', instrumentCode: 'L02-8133', size: '2.76-3.00', equipmentNo: '1023435', maintaincePlan: '26788', notificationNumber: '8000283953', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '17', instrumentCode: 'L02-8135', size: '3.01-3.25', equipmentNo: '1041745', maintaincePlan: '75102', notificationNumber: '8000283912', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '18', instrumentCode: 'L02-8136', size: '3.26-3.50', equipmentNo: '1023436', maintaincePlan: '26789', notificationNumber: '8000283913', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '19', instrumentCode: 'L02-8142', size: '4.01-4.25', equipmentNo: '1023414', maintaincePlan: '26767', notificationNumber: '8000283916', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '20', instrumentCode: 'L02-8148', size: '4.51-4.75', equipmentNo: '1023416', maintaincePlan: '26769', notificationNumber: '8000283917', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '21', instrumentCode: 'L02-8150', size: '4.76-5.00', equipmentNo: '1041747', maintaincePlan: '75104', notificationNumber: '8000283918', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '22', instrumentCode: 'L02-8152', size: '5.01-525', equipmentNo: '1041744', maintaincePlan: '75101', notificationNumber: '8000284000', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '23', instrumentCode: 'L02-8153', size: '5.26-5.50', equipmentNo: '1023441', maintaincePlan: '26794', notificationNumber: '8000284001', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes ', description:'217566_Chetan' },
  { slNo: '24', instrumentCode: 'L02-8155', size: '5.51-5.75', equipmentNo: '1023430', maintaincePlan: '26783', notificationNumber: '8000284003', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '25', instrumentCode: 'L02-8157', size: '5.76-6.01', equipmentNo: '1023432', maintaincePlan: '26785', notificationNumber: '8000284004', calibrationDate: '27-05-2023', calibrationDueDate: '27-05-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '26', instrumentCode: 'L02-8116', size: '0.51 - 0.75', equipmentNo: '1023443', maintaincePlan: '26796', notificationNumber: '800283401', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '27', instrumentCode: 'L02-8118', size: '1.01 - 1.25', equipmentNo: '1023407', maintaincePlan: '26760', notificationNumber: '8000283530', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '28', instrumentCode: 'L02-8122', size: '1.51 - 1.75', equipmentNo: '1023453', maintaincePlan: '26806', notificationNumber: '8000283392', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '29', instrumentCode: 'L02-8127', size: '2.01 - 2.25', equipmentNo: '1023446', maintaincePlan: '26799', notificationNumber: '8000283541', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '30', instrumentCode: 'L02-8131', size: '2.51-2.75', equipmentNo: '1023448', maintaincePlan: '26801', notificationNumber: '8000283542', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '31', instrumentCode: 'L02-8134', size: '3.01-3.25', equipmentNo: '1023415', maintaincePlan: '26768', notificationNumber: '8000283531', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '32', instrumentCode: 'L02-8138', size: '3.51-3.75', equipmentNo: '1023715', maintaincePlan: '27068', notificationNumber: '8000283532', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '33', instrumentCode: 'L02-8149', size: '4.76-5.00', equipmentNo: '1023451', maintaincePlan: '26804', notificationNumber: '8000283543', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '34', instrumentCode: 'L02-8154', size: '5.26-5.50', equipmentNo: '1023442', maintaincePlan: '26795', notificationNumber: '8000283536', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '35', instrumentCode: 'L02-8156', size: '5.51-5.75', equipmentNo: '1023431', maintaincePlan: '26784', notificationNumber: '8000283499', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '36', instrumentCode: 'L02-8158', size: '5.76-6.00', equipmentNo: '1023433', maintaincePlan: '26786', notificationNumber: '8000283540', calibrationDate: '11-05-2023', calibrationDueDate: '11-05-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '37', instrumentCode: 'L02-8143', size: '4.01 to 4.25', equipmentNo: '1023428', maintaincePlan: '', notificationNumber: '8000278808', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '38', instrumentCode: 'L02-8121', size: '1.26 to 1.50-A', equipmentNo: '1023410', maintaincePlan: '', notificationNumber: '8000278857', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '39', instrumentCode: 'L02-8120', size: '1.26 to 1.50-B', equipmentNo: '1023409', maintaincePlan: '', notificationNumber: '8000278858', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '40', instrumentCode: 'L02-8141', size: '3.76 to 4.0', equipmentNo: '1023456', maintaincePlan: '', notificationNumber: '8000278837', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '41', instrumentCode: 'L02-8092', size: '7.60 to 8.03', equipmentNo: '1023038', maintaincePlan: '', notificationNumber: '8000278838', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C2_R4', other: 'Yes', description:'' },
  { slNo: '42', instrumentCode: 'L02-8128', size: '2.26 to 2.50', equipmentNo: '1023450', maintaincePlan: '', notificationNumber: '8000278807', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '43', instrumentCode: 'L02-8132', size: '2.76 to 3.0', equipmentNo: '1023434', maintaincePlan: '', notificationNumber: '8000278859', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '44', instrumentCode: 'L02-8137', size: '3.26 to 3.50', equipmentNo: '1023437', maintaincePlan: '', notificationNumber: '8000278910', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '45', instrumentCode: 'L02-8139', size: '3.51 to 3.75', equipmentNo: '1041746', maintaincePlan: '', notificationNumber: '8000278806', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '46', instrumentCode: 'L02-8145', size: '4.26 to 4.50', equipmentNo: '1023440', maintaincePlan: '', notificationNumber: '8000278805', calibrationDate: '07-02-2023', calibrationDueDate: '07-02-2025', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '47', instrumentCode: 'L02-8119', size: '1.01 - 1.25', equipmentNo: '1023408', maintaincePlan: '26761', notificationNumber: '8000305763', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '48', instrumentCode: 'L02-8159', size: '0.1-0.25', equipmentNo: '1066627', maintaincePlan: '125341', notificationNumber: '8000305699', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '49', instrumentCode: 'L02-8041', size: '2.00 - 10.00', equipmentNo: '1023575', maintaincePlan: '26928', notificationNumber: '8000305765', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C2_R1', other: 'Yes', description:'' },
  { slNo: '50', instrumentCode: 'L02-8059', size: '1.00 - 6.00', equipmentNo: '1023032', maintaincePlan: '26385', notificationNumber: '8000305766', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C2_R1', other: 'Yes', description:'' },
  { slNo: '51', instrumentCode: 'L02-8084', size: '1.00 - 2.50', equipmentNo: '1023637', maintaincePlan: '26990', notificationNumber: '8000305787', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C2_R1', other: 'Yes', description:'' },
  { slNo: '52', instrumentCode: 'L02-8086', size: '5.51 - 7.00', equipmentNo: '1023037', maintaincePlan: '26390', notificationNumber: '8000305788', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C2_R2', other: 'Yes', description:'' },
  { slNo: '53', instrumentCode: 'L02-8097', size: '5.60 - 6.03', equipmentNo: '1023634', maintaincePlan: '26987', notificationNumber: '8000305786', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C2_R2', other: 'Yes', description:'' },
  { slNo: '54', instrumentCode: 'L02-8098', size: '7.60 - 8.03', equipmentNo: '1023635', maintaincePlan: '26988', notificationNumber: '8000305785', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C2_R4', other: 'Yes', description:'' },
  { slNo: '55', instrumentCode: 'L02-8100', size: '15.51-16.0', equipmentNo: '1023279', maintaincePlan: '26632', notificationNumber: '8000305783', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C3_R3', other: 'Yes', description:'' },
  { slNo: '56', instrumentCode: 'L02-8101', size: '16.51-17.0', equipmentNo: '1023216', maintaincePlan: '26569', notificationNumber: '8000305764', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C3_R3', other: 'Yes', description:'' },
  { slNo: '57', instrumentCode: 'L02-8102', size: '17.51-18.00', equipmentNo: '1023224', maintaincePlan: '26577', notificationNumber: '8000305782', calibrationDate: '02-09-2024', calibrationDueDate: '01-09-2026', remarks: 'CALIBRATED', location: 'C3_R4', other: 'Yes', description:'' },
  { slNo: '58', instrumentCode: 'L02-8111', size: '13.01 - 14.0', equipmentNo: '1023587', maintaincePlan: '26940', notificationNumber: '8000305784', calibrationDate: '03-09-2024', calibrationDueDate: '02-09-2026', remarks: 'CALIBRATED', location: 'C3_R1', other: 'Yes', description:'' },
  { slNo: '59', instrumentCode: 'L02-8126', size: '2.01 - 2.25', equipmentNo: '1023445', maintaincePlan: '26798', notificationNumber: '8000301842', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '60', instrumentCode: 'L02-8144', size: '4.26-4.50', equipmentNo: '1023439', maintaincePlan: '26792', notificationNumber: '8000301843', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C1_R2', other: 'Yes', description:'' },
  { slNo: '61', instrumentCode: 'L02-8147', size: '4.51-4.75', equipmentNo: '1023429', maintaincePlan: '26782', notificationNumber: '8000301844', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C1_R4', other: 'Yes', description:'' },
  { slNo: '62', instrumentCode: 'L02-8088', size: '8.51- 10.00', equipmentNo: '1022993', maintaincePlan: '26346', notificationNumber: '8000301845', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C3_R2', other: 'Yes', description:'' },
  { slNo: '63', instrumentCode: 'L02-8125', size: '1.76 - 2.00', equipmentNo: '1023455', maintaincePlan: '26808', notificationNumber: '8000301841', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C1_R1', other: 'Yes', description:'' },
  { slNo: '64', instrumentCode: 'L02-8113', size: '16.01-16.50', equipmentNo: '1023497', maintaincePlan: '26850', notificationNumber: '8000301809', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C3_R3', other: 'Yes', description:'' },
  { slNo: '65', instrumentCode: 'L02-8123', size: '1.51 - 1.75', equipmentNo: '1023454', maintaincePlan: '26807', notificationNumber: '8000301840', calibrationDate: '01-07-2024', calibrationDueDate: '30-06-2026', remarks: 'CALIBRATED', location: 'C1_R3', other: 'Yes', description:'' },
  { slNo: '66', instrumentCode: 'L02-8110', size: '12.01-13.00', equipmentNo: '1023495', maintaincePlan: '26848', notificationNumber: '8000301807', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C3_R1', other: 'Issued ', description:'MANJUNATH KS 211691/03-07-2024' },
  { slNo: '67', instrumentCode: 'L02-8112', size: '14.01-15.00', equipmentNo: '1023508', maintaincePlan: '26861', notificationNumber: '8000301808', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C3_R2', other: 'Yes', description:'' },
  { slNo: '68', instrumentCode: 'L02-8103', size: '18.01-18.50', equipmentNo: '1023225', maintaincePlan: '26578', notificationNumber: '8000301804', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C3_R4', other: 'Yes', description:'' },
  { slNo: '69', instrumentCode: 'L02-8109', size: '11.01-12.00', equipmentNo: '1023507', maintaincePlan: '26860', notificationNumber: '8000301806', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C3_R1', other: 'Yes', description:'' },
  { slNo: '70', instrumentCode: 'L02-8093', size: '9.60 - 10.03', equipmentNo: '1023039', maintaincePlan: '26392', notificationNumber: '8000301802', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C2_R4', other: 'Yes', description:'' },
  { slNo: '71', instrumentCode: 'L02-8099', size: '15.01 - 15.50', equipmentNo: '1023278', maintaincePlan: '', notificationNumber: '8000301803', calibrationDate: '29-06-2024', calibrationDueDate: '28-06-2026', remarks: 'CALIBRATED', location: 'C3_R2', other: 'Yes', description:'' },
];


const columns = [
  {
    title: 'Sl No',
    dataIndex: 'slNo',
    key: 'slNo',
    sorter: (a, b) => a.slNo - b.slNo,
  },
  {
    title: 'Instrument Code',
    dataIndex: 'instrumentCode',
    key: 'instrumentCode',
    sorter: (a, b) => a.instrumentCode.localeCompare(b.instrumentCode),
    filterSearch: true,
    filters: [...new Set(toolsData.map(item => ({
      text: item.instrumentCode,
      value: item.instrumentCode,
    })))],
    onFilter: (value, record) => record.instrumentCode.indexOf(value) === 0,
  },
  {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
    sorter: (a, b) => a.size.localeCompare(b.size),
    filterSearch: true,
    filters: [...new Set(toolsData.map(item => ({
      text: item.size,
      value: item.size,
    })))],
    onFilter: (value, record) => record.size.indexOf(value) === 0,
  },
  {
    title: 'Equipment No.',
    dataIndex: 'equipmentNo',
    key: 'equipmentNo',
    sorter: (a, b) => a.equipmentNo.localeCompare(b.equipmentNo),
    filterSearch: true,
    filters: [...new Set(toolsData.map(item => ({
      text: item.equipmentNo,
      value: item.equipmentNo,
    })))],
    onFilter: (value, record) => record.equipmentNo.indexOf(value) === 0,
  },
  {
    title: 'Maintaince Plan',
    dataIndex: 'maintaincePlan',
    key: 'maintaincePlan',
  },
  {
    title: 'Notification Number',
    dataIndex: 'notificationNumber',
    key: 'notificationNumber',
  },
  {
    title: 'Calibration Date',
    dataIndex: 'calibrationDate',
    key: 'calibrationDate',
  },
  {
    title: 'Calibration Due Date',
    dataIndex: 'calibrationDueDate',
    key: 'calibrationDueDate',
    render: (text, record) => { // Added record parameter to access the actual due date
        const today = new Date();
        const dueDate = new Date(record.calibrationDueDate.split('-').reverse().join('-')); // Convert to Date object
        const timeDiff = dueDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate difference in days

        let bgColor;
        if (daysDiff <= 0) {
            bgColor = 'red'; // Overdue
        } else if (daysDiff <= 15) {
            bgColor = 'orange'; // Near 2 to 15 days
        } else if (daysDiff <= 30) {
            bgColor = 'yellow'; // Near 16 to 30 days
        } else {
            bgColor = 'transparent'; // Default
        }
        
        // Debugging: Log the background color and due date
        console.log(`Due Date: ${record.calibrationDueDate}, Background Color: ${bgColor}`);

        return (
            <span style={{ backgroundColor: bgColor, padding: '4px', borderRadius: '4px' }}>
                {record.calibrationDueDate}
            </span>
        ); // Display the actual due date
    },
},
  {
    title: 'Remarks',
    dataIndex: 'remarks',
    key: 'remarks',
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    filters: [...new Set(toolsData.map(item => ({
      text: item.location,
      value: item.location,
    })))],
    onFilter: (value, record) => record.location === value,
    filterSearch: true,
  },
  {
    title: 'Other',
    dataIndex: 'other',
    key: 'other',
  },
  {
    title: 'Description', // Duplicate column, consider removing or renaming
    dataIndex: 'description',
    key: 'description',
  },
  
];

const CalibrationTable = () => {
    const [filteredInfo, setFilteredInfo] = useState({});
  return (
    <div className="p-4">

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <CalibrationCard
    title="Total Tools"  // Example title
    icon={Filter}  // Replace with the actual icon component you want to use
/>
    </div>

    <Card title="Calibration Master List" className="mb-4 mt-7">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Calibration Master List</h2>

                    {/* Legend for background colors */}
        <div className="mb-4">
                    <span style={{ 
                        backgroundColor: 'green', 
                        borderRadius: '50%', 
                        width: '16px', 
                        height: '16px', 
                        display: 'inline-block', 
                        marginRight: '1px',
                        marginLeft: '14px' 
                    }}></span> Calibrated
                    <span style={{ 
                        backgroundColor: 'red', 
                        borderRadius: '50%', 
                        width: '16px', 
                        height: '16px', 
                        display: 'inline-block', 
                        marginRight: '1px',
                        marginLeft: '14px' 
                    }}></span> Overdue
                    <span style={{ 
                        backgroundColor: 'orange', 
                        borderRadius: '50%', 
                        width: '16px', 
                        height: '16px', 
                        display: 'inline-block', 
                        marginRight: '1px',
                        marginLeft: '14px' 
                    }}></span> Near 2 to 15 days
                    <span style={{ 
                        backgroundColor: 'yellow', 
                        borderRadius: '50%', 
                        width: '16px', 
                        height: '16px', 
                        display: 'inline-block', 
                        marginRight: '1px',
                        marginLeft: '14px' 
                    }}></span> Near 16 to 30 days
                    
                </div>
        </div>


        <Table 
            dataSource={toolsData} 
            pagination={{ 
              pageSize: 4,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            columns={columns} 
            onChange={(pagination, filters) => setFilteredInfo(filters)} 
            filteredInfo={filteredInfo}
        />
    </Card>
</div>
);
};

//   <Table dataSource={data} columns={columns} />;


export default CalibrationTable;