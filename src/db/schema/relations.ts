import { defineRelations } from "drizzle-orm";

import { appointmentsTable } from "./appointments";
import { clinicsTable } from "./clinics";
import { doctorsTable } from "./doctors";
import { patientsTable } from "./patients";
import { usersTable } from "./users";
import { usersToClinicsTable } from "./usersToClinics";

export const relations = defineRelations(
  {
    usersTable,
    clinicsTable,
    usersToClinicsTable,
    doctorsTable,
    patientsTable,
    appointmentsTable,
  },
  (helpers) => ({
    usersTable: {
      usersToClinics: helpers.many.usersToClinicsTable(),
    },
    usersToClinicsTable: {
      user: helpers.one.usersTable({
        from: [helpers.usersToClinicsTable.userId],
        to: [helpers.usersTable.id],
      }),
      clinic: helpers.one.clinicsTable({
        from: [helpers.usersToClinicsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
    },
    clinicsTable: {
      doctors: helpers.many.doctorsTable(),
      patients: helpers.many.patientsTable(),
      appointments: helpers.many.appointmentsTable(),
      usersToClinics: helpers.many.usersToClinicsTable(),
    },
    doctorsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.doctorsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      appointments: helpers.many.appointmentsTable(),
    },
    patientsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.patientsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      appointments: helpers.many.appointmentsTable(),
    },
    appointmentsTable: {
      clinic: helpers.one.clinicsTable({
        from: [helpers.appointmentsTable.clinicId],
        to: [helpers.clinicsTable.id],
      }),
      patient: helpers.one.patientsTable({
        from: [helpers.appointmentsTable.patientId],
        to: [helpers.patientsTable.id],
      }),
      doctor: helpers.one.doctorsTable({
        from: [helpers.appointmentsTable.doctorId],
        to: [helpers.doctorsTable.id],
      }),
    },
  }),
);
