const mongoose = require("mongoose");
const Student = require("../models/Student");
const Trainer = require("../models/Trainer");
const TPO = require("../models/TPO");
const Admin = require("../models/Admin");

const seedUsers = async () => {
  try {
    // Check for existing users
    const existingStudent = await Student.findOne({
      email: "stu1@example.com",
    });
    const existingTrainer = await Trainer.findOne({ email: "tr1@example.com" });
    const existingTPO = await TPO.findOne({ email: "tpo1@example.com" });

    if (existingStudent && existingTrainer && existingTPO) {
      console.log("Seed data already exists. Skipping seeding process.");
      return;
    }

    // Create an admin account if not exists
    let admin = await Admin.findOne();
    if (!admin) {
      admin = await Admin.create({
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        name: "Super Admin",
        role: "super_admin",
      });
    }

    let students = [],
      trainers = [],
      tpos = [];

    // Create Students if they don't exist
    if (!existingStudent) {
      students = await Student.create([
        {
          username: "stu1@example.com",
          password: "stu1@example.com",
          name: "Student One",
          rollNo: "21CS001",
          email: "stu1@example.com",
          phonenumber: "9876543210",
          college: "KIET",
          branch: "CSM",
          yearOfPassing: "2025",
        },
        {
          username: "stu2@example.com",
          password: "stu2@example.com",
          name: "Student Two",
          rollNo: "21CS002",
          email: "stu2@example.com",
          phonenumber: "9876543211",
          college: "KIET",
          branch: "CSM",
          yearOfPassing: "2025",
        },
      ]);
      console.log("Created new students");
    }

    // Create Trainers if they don't exist
    if (!existingTrainer) {
      trainers = await Trainer.create([
        {
          name: "Trainer One",
          email: "tr1@example.com",
          password: "tr1@example.com",
          phone: "9876543212",
          employeeId: "TR001",
          subjectDealing: "Python Programming",
          category: "technical",
        },
        {
          name: "Trainer Two",
          email: "tr2@example.com",
          password: "tr2@example.com",
          phone: "9876543213",
          employeeId: "TR002",
          subjectDealing: "Soft Skills",
          category: "non-technical",
        },
      ]);
      console.log("Created new trainers");
    }

    // Create TPOs if they don't exist
    if (!existingTPO) {
      tpos = await TPO.create([
        {
          name: "TPO One",
          email: "tpo1@example.com",
          password: "tpo1@example.com",
          phone: "9876543214",
          createdBy: admin._id,
        },
        {
          name: "TPO Two",
          email: "tpo2@example.com",
          password: "tpo2@example.com",
          phone: "9876543215",
          createdBy: admin._id,
        },
      ]);
      console.log("Created new TPOs");
    }

    console.log("Seed data created successfully");
    console.log("Dummy Credentials:");
    console.log("\nStudents:");
    console.log("1. Username: student1, Password: student123");
    console.log("2. Username: student2, Password: student123");
    console.log("\nTrainers:");
    console.log("1. Email: trainer1@example.com, Password: trainer123");
    console.log("2. Email: trainer2@example.com, Password: trainer123");
    console.log("\nTPOs:");
    console.log("1. Email: tpo1@example.com, Password: tpo123");
    console.log("2. Email: tpo2@example.com, Password: tpo123");

    return { students, trainers, tpos };
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
};

module.exports = seedUsers;
