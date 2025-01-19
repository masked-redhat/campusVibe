// import models from "../../constants/db.js";
// import { DataTypes as DT } from "sequelize";
// import db from "../../db/sql/connection.js";

// db.define("Job", {
//   id: models.SQLMODEL.ID,
//   title: {
//     type: DT.STRING,
//     allowNull: false,
//   },
//   description: {
//     type: DT.STRING,
//     allowNull: false,
//   },
//   requiredSkills: {
//     type: DT.ARRAY(DT.STRING),
//     allowNull: false,
//   },
//   preferredSkills: { type: DT.ARRAY(DT.STRING) },
//   locationType: {
//     type: DT.ENUM("Remote", "Physical"),
//     allowNull: false,
//   },
//   experienceLevel: DT.ENUM("Entry", "Intermediate", "Expert"),
//   jobType: {
//     type: DT.ENUM("Part Time", "Full Time", "Internship"),
//     allowNull: false,
//     defaultValue: "Full Time",
//   },
//   duration: {
//     type: DT.INTEGER,
//     validate: {
//       isInternship() {
//         if (this.jobType !== "Internship" && duration !== null)
//           throw new Error(
//             "Duration can be set only while the application is for internship"
//           );
//       },
//     },
//   },
//   stipendPerMonth: DT.INTEGER,
//   applyBy: DT.DATE,
//   intershipWithJobOffer: DT.BOOLEAN,
// });

// const Job = db.models.Job;

// export default Job;
