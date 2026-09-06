"""Tests for reading the site owner out of the production seed."""

from __future__ import annotations

import pytest

from tools.seo.seed import parse_site_owner
from tools.seo.tests.fixtures import PLACEHOLDER_SEED_SQL, SEED_SQL

USERS_INSERT = "INSERT INTO users (name, title) VALUES ('Sam O''Toole', 'Staff Engineer');\n"


class TestParseSiteOwner:
    def test_reads_the_first_user(self):
        owner = parse_site_owner(SEED_SQL)

        assert owner is not None
        assert owner.name == "Sam O'Toole"
        assert owner.title == "Staff Platform Engineer"
        assert owner.profile_image == "images/sam-profile.jpg"
        assert owner.bio.startswith("Sam builds resilient delivery platforms")

    def test_orders_contacts_by_their_display_order(self):
        owner = parse_site_owner(SEED_SQL)

        assert [contact.type for contact in owner.contacts] == [
            "phone",
            "email",
            "website",
            "github",
            "linkedin",
        ]

    def test_reads_the_skills_in_file_order(self):
        assert parse_site_owner(SEED_SQL).skills == ("Kubernetes", "Go", "Terraform", "PostgreSQL")

    def test_takes_the_employer_from_the_role_with_no_end_date(self):
        assert parse_site_owner(SEED_SQL).employer == "Northwind Platforms"

    def test_takes_the_institution_from_the_latest_course_of_study(self):
        assert parse_site_owner(SEED_SQL).institution == "Sample University"

    def test_falls_back_to_the_role_that_ended_most_recently(self):
        sql = USERS_INSERT + (
            "INSERT INTO job_history (userId, company, startDate, endDate) VALUES\n"
            "(1, 'Older Employer', '2016-01-01', '2019-12-31'),\n"
            "(1, 'Newer Employer', '2020-01-01', '2023-12-31');\n"
        )

        assert parse_site_owner(sql).employer == "Newer Employer"

    def test_takes_the_latest_start_date_among_current_roles(self):
        sql = USERS_INSERT + (
            "INSERT INTO job_history (userId, company, startDate, endDate) VALUES\n"
            "(1, 'Older Employer', '2016-01-01', NULL),\n"
            "(1, 'Newer Employer', '2020-01-01', NULL);\n"
        )

        assert parse_site_owner(sql).employer == "Newer Employer"

    def test_leaves_the_employer_absent_when_no_role_is_seeded(self):
        assert parse_site_owner(USERS_INSERT).employer is None

    def test_leaves_the_institution_absent_when_no_course_is_seeded(self):
        assert parse_site_owner(USERS_INSERT).institution is None

    def test_keeps_only_the_rows_of_the_first_user(self):
        sql = (
            "INSERT INTO users (id, name, title) VALUES (1, 'Sam', 'Engineer'), (2, 'Ada', 'Lead');"
            "INSERT INTO skills (userId, skill) VALUES (1, 'Go'), (2, 'Rust');"
        )

        assert parse_site_owner(sql).skills == ("Go",)

    def test_infers_the_owner_id_when_the_users_row_carries_none(self):
        sql = USERS_INSERT + "INSERT INTO skills (userId, skill) VALUES (3, 'Go'), (4, 'Rust');"

        assert parse_site_owner(sql).skills == ("Go",)

    def test_keeps_child_rows_that_name_no_owner(self):
        sql = USERS_INSERT + "INSERT INTO skills (skill) VALUES ('Go');"

        assert parse_site_owner(sql).skills == ("Go",)

    def test_reads_a_snake_case_owner_column(self):
        sql = (
            "INSERT INTO users (id, name, title) VALUES (1, 'Sam', 'Engineer'), (2, 'Ada', 'Lead');"
            "INSERT INTO contact_info (user_id, type, value, display_order) VALUES"
            "(1, 'email', 'sam@sample-person.test', 1), (2, 'email', 'ada@other.test', 1);"
        )

        assert [contact.value for contact in parse_site_owner(sql).contacts] == [
            "sam@sample-person.test"
        ]

    def test_drops_a_contact_with_no_type_or_no_value(self):
        sql = USERS_INSERT + (
            "INSERT INTO contact_info (user_id, type, value, display_order) VALUES\n"
            "(1, 'email', '', 1),\n"
            "(1, '', 'x', 2),\n"
            "(1, 'github', 'https://github.com/sample-person', 3);\n"
        )

        assert [contact.type for contact in parse_site_owner(sql).contacts] == ["github"]

    def test_orders_a_contact_with_an_unreadable_display_order_first(self):
        sql = USERS_INSERT + (
            "INSERT INTO contact_info (user_id, type, value, display_order) VALUES\n"
            "(1, 'github', 'https://github.com/sample-person', 2),\n"
            "(1, 'email', 'sam@sample-person.test', 'x');\n"
        )

        assert [contact.type for contact in parse_site_owner(sql).contacts] == ["email", "github"]


class TestOmission:
    def test_rejects_the_template_placeholders(self):
        assert parse_site_owner(PLACEHOLDER_SEED_SQL) is None

    def test_rejects_a_placeholder_name(self):
        sql = "INSERT INTO users (name, title) VALUES ('Your Name', 'X');"

        assert parse_site_owner(sql) is None

    def test_rejects_a_placeholder_title(self):
        sql = "INSERT INTO users (name, title) VALUES ('Sam', 'your title');"

        assert parse_site_owner(sql) is None

    @pytest.mark.parametrize("email", ["sam@example.com", "sam@example.org", "sam@example.net"])
    def test_rejects_a_placeholder_email(self, email):
        sql = USERS_INSERT + (
            "INSERT INTO contact_info (user_id, type, value, display_order) VALUES"
            f"(1, 'email', '{email}', 1);"
        )

        assert parse_site_owner(sql) is None

    def test_rejects_a_seed_with_no_users_row(self):
        assert parse_site_owner("INSERT INTO skills (skill) VALUES ('Go');") is None

    def test_rejects_a_user_with_no_name(self):
        assert parse_site_owner("INSERT INTO users (name, title) VALUES ('', 'X');") is None

    def test_rejects_a_user_with_no_title(self):
        assert parse_site_owner("INSERT INTO users (name, title) VALUES ('Sam', NULL);") is None

    def test_rejects_an_unterminated_literal(self):
        assert parse_site_owner("INSERT INTO users (name, title) VALUES ('Sam") is None

    def test_rejects_an_unterminated_block_comment(self):
        assert parse_site_owner(USERS_INSERT + "/* trailing") is None

    def test_rejects_an_empty_seed(self):
        assert parse_site_owner("") is None
