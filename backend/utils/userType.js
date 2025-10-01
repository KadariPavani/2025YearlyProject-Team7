const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');

const USER_TYPES = ['tpo', 'trainer', 'student', 'coordinator'];

const getModelByUserType = (userType) => {
  switch (userType) {
    case 'tpo':
      return TPO;
    case 'trainer':
      return Trainer;
    case 'student':
      return Student;
    case 'coordinator':
      return Coordinator;
    default:
      return null;
  }
};

const isValidUserType = (userType) => USER_TYPES.includes(userType);

module.exports = {
  USER_TYPES,
  getModelByUserType,
  isValidUserType,
};


