export async function up(knex) {

  // COLLEGES
  await knex.schema.createTable("colleges", (t) => {
  t.increments("college_id").primary();
  t.string("college_code").unique().notNullable();
  t.string("college_name").notNullable();
  t.string("short_name").notNullable(); // SGSITS
  t.string("city").notNullable();
});

  // USERS
  await knex.schema.createTable("users", (t) => {
    t.increments("user_id").primary();
    t.string("username").notNullable();
    t.string("email").unique().notNullable();
    t.string("password_hash").notNullable();
    t.enu("role", ["ANO", "CADET", "ALUMNI"]).notNullable();
    t.integer("college_id").references("college_id").inTable("colleges");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // ANO
  await knex.schema.createTable("anos", (t) => {
    t.increments("ano_id").primary();
    t.integer("user_id").unique().references("user_id").inTable("users").onDelete("CASCADE");
    t.string("designation");
    t.date("appointment_date");
  });

  // ALUMNI
  await knex.schema.createTable("alumni", (t) => {
    t.increments("alumni_id").primary();
    t.integer("user_id").unique().references("user_id").inTable("users").onDelete("CASCADE");
    t.integer("graduation_year");
    t.string("donation_badges");
  });

  // CADET RANKS
  await knex.schema.createTable("cadet_ranks", (t) => {
    t.increments("id").primary();
    t.string("rank_name").unique().notNullable();
  });

  // CADET DESIGNATIONS
  await knex.schema.createTable("cadet_designations", (t) => {
    t.increments("id").primary();
    t.string("name").unique().notNullable();
  });

  // CADET PROFILE
  await knex.schema.createTable("cadet_profiles", (t) => {
    t.string("regimental_no").primary();
    t.integer("user_id").unique().references("user_id").inTable("users").onDelete("CASCADE");
    t.string("full_name").notNullable();
    t.string("email").notNullable();
    t.date("dob");
    t.integer("joining_year");
    t.integer("college_id").references("college_id").inTable("colleges");
    t.integer("rank_id").references("id").inTable("cadet_ranks");
  });

  // CADET ROLE HISTORY
  await knex.schema.createTable("cadet_roles", (t) => {
    t.increments("role_id").primary();
    t.string("regimental_no").references("regimental_no").inTable("cadet_profiles").onDelete("CASCADE");
    t.integer("designation_id").references("id").inTable("cadet_designations");
    t.date("start_date");
    t.date("end_date");
  });

  // CHAT MESSAGES
  await knex.schema.createTable("chat_messages", (t) => {
    t.increments("id").primary();
    t.string("sender").notNullable();
    t.text("message").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("chat_messages");
  await knex.schema.dropTableIfExists("cadet_roles");
  await knex.schema.dropTableIfExists("cadet_profiles");
  await knex.schema.dropTableIfExists("cadet_designations");
  await knex.schema.dropTableIfExists("cadet_ranks");
  await knex.schema.dropTableIfExists("alumni");
  await knex.schema.dropTableIfExists("anos");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("colleges");
}
