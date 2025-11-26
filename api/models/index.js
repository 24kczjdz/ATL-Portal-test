// ATLab-Admin Database Models
// This file exports all models that use the ATLab-Admin database

import Equipment from './Equipment.js';
import EquipmentBooking from './EquipmentBooking.js';
import BookingLog from './BookingLog.js';
import Project from './Project.js';
import ProjectMember from './ProjectMember.js';
import SigMember from './SigMember.js';
import StudentInterestGroup from './StudentInterestGroup.js';
import VenueBooking from './VenueBooking.js';
import Venue from './Venue.js';
import EmailTemplate from './EmailTemplate.js';
import EmailNotification from './EmailNotification.js';

// Export all models
export {
  Equipment,
  EquipmentBooking,
  BookingLog,
  Project,
  ProjectMember,
  SigMember,
  StudentInterestGroup,
  VenueBooking,
  Venue,
  EmailTemplate,
  EmailNotification
};

// Export as default object
export default {
  Equipment,
  EquipmentBooking,
  BookingLog,
  Project,
  ProjectMember,
  SigMember,
  StudentInterestGroup,
  VenueBooking,
  Venue,
  EmailTemplate,
  EmailNotification
};
