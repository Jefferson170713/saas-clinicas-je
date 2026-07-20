import { defineRelations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 0 - Sunday
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
