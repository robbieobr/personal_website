"""Tests for the document head, the JSON-LD graph and the crawler files."""

from __future__ import annotations

import json
import re
from dataclasses import replace

import pytest

from tools.seo.metadata import (
    DESCRIPTION_LIMIT,
    build_json_ld,
    build_metadata,
    inject_head,
    read_html_lang,
    render_robots_txt,
    render_sitemap_xml,
    replace_title,
    summarise,
)
from tools.seo.seed import ContactEntry
from tools.seo.tests.fixtures import HOST, INDEX_HTML, METADATA, OWNER


def json_ld_body(document: str) -> str:
    """The raw text of the document's ld+json script."""
    return re.search(
        r'<script type="application/ld\+json">(.*?)</script>', document, re.DOTALL
    ).group(1)


def json_ld_of(document: str) -> dict:
    """The JSON-LD payload of the document's ld+json script."""
    return json.loads(json_ld_body(document))


class TestSummarise:
    def test_falls_back_when_the_bio_is_empty(self):
        assert summarise("   ", "Sam — Engineer") == "Sam — Engineer"

    def test_collapses_whitespace(self):
        assert summarise("a\n  b\tc", "x") == "a b c"

    def test_keeps_a_short_bio_whole(self):
        assert summarise("A short bio.", "x") == "A short bio."

    def test_keeps_whole_sentences_up_to_the_limit(self):
        bio = f"{'a' * 100}. {'b' * 100}. {'c' * 20}."
        summary = summarise(bio, "x")

        assert summary == f"{'a' * 100}."
        assert len(summary) <= DESCRIPTION_LIMIT

    def test_trims_on_a_word_boundary_when_the_first_sentence_is_too_long(self):
        summary = summarise(" ".join(["word"] * 80), "x")

        assert summary.endswith("…")
        assert len(summary) <= DESCRIPTION_LIMIT
        assert "wor…" not in summary

    def test_drops_trailing_punctuation_before_the_ellipsis(self):
        summary = summarise(f"{'a' * 140} short, {'b' * 40}", "x")

        assert summary.endswith("short…")

    def test_trims_a_single_long_word(self):
        summary = summarise("a" * 400, "x")

        assert len(summary) == DESCRIPTION_LIMIT
        assert summary.endswith("…")


class TestBuildMetadata:
    def test_derives_the_origin_and_canonical_url(self):
        assert METADATA.origin == f"https://{HOST}"
        assert METADATA.canonical == f"https://{HOST}/"

    def test_builds_the_page_title_from_the_name_and_role(self):
        assert METADATA.page_title == "Sam O'Toole | Staff Platform Engineer"

    def test_points_the_card_at_the_generated_image(self):
        assert METADATA.og_image_url == f"https://{HOST}/og-image.png"
        assert METADATA.og_image_alt == "Sam O'Toole, Staff Platform Engineer"

    def test_resolves_the_profile_photo_against_the_origin(self):
        assert METADATA.profile_image_path == "images/sam-profile.jpg"
        assert METADATA.profile_image_url == f"https://{HOST}/images/sam-profile.jpg"

    def test_strips_a_leading_slash_from_the_profile_photo(self):
        metadata = build_metadata(replace(OWNER, profile_image="/images/sam.jpg"), HOST)

        assert metadata.profile_image_path == "images/sam.jpg"

    def test_leaves_the_profile_photo_absent_when_the_seed_names_none(self):
        metadata = build_metadata(replace(OWNER, profile_image=None), HOST)

        assert metadata.profile_image_path is None
        assert metadata.profile_image_url is None

    def test_takes_the_email_from_the_contact_rows(self):
        assert METADATA.email == "sam@sample-person.test"

    def test_leaves_the_email_absent_when_no_contact_holds_one(self):
        metadata = build_metadata(replace(OWNER, contacts=()), HOST)

        assert metadata.email is None

    def test_lists_profiles_elsewhere_as_same_as(self):
        assert METADATA.same_as == (
            "https://github.com/sample-person",
            "https://www.linkedin.com/in/sample-person",
        )

    def test_excludes_the_sites_own_host_from_same_as(self):
        assert f"https://www.{HOST}" not in METADATA.same_as

    def test_excludes_a_contact_that_is_not_an_absolute_url(self):
        owner = replace(OWNER, contacts=(ContactEntry(type="github", value="sample-person"),))

        assert build_metadata(owner, HOST).same_as == ()

    def test_carries_the_employer_institution_and_skills_through(self):
        assert METADATA.employer == "Northwind Platforms"
        assert METADATA.institution == "Sample University"
        assert METADATA.skills == OWNER.skills


class TestBuildJsonLd:
    def test_describes_the_person_the_page_and_the_site(self):
        graph = build_json_ld(METADATA, "en")["@graph"]

        assert [node["@type"] for node in graph] == ["Person", "ProfilePage", "WebSite"]

    def test_names_the_declared_page_language(self):
        graph = build_json_ld(METADATA, "ga")["@graph"]

        assert graph[1]["inLanguage"] == "ga"
        assert graph[2]["inLanguage"] == "ga"

    def test_links_the_page_to_the_person_and_the_site(self):
        graph = build_json_ld(METADATA, "en")["@graph"]

        assert graph[1]["mainEntity"] == {"@id": f"https://{HOST}/#person"}
        assert graph[1]["isPartOf"] == {"@id": f"https://{HOST}/#website"}

    def test_describes_the_employer_and_the_institution(self):
        person = build_json_ld(METADATA, "en")["@graph"][0]

        assert person["worksFor"] == {"@type": "Organization", "name": "Northwind Platforms"}
        assert person["alumniOf"] == {
            "@type": "CollegeOrUniversity",
            "name": "Sample University",
        }

    def test_writes_the_email_as_a_mailto_url(self):
        person = build_json_ld(METADATA, "en")["@graph"][0]

        assert person["email"] == "mailto:sam@sample-person.test"

    @pytest.mark.parametrize(
        ("field", "key"),
        [
            ("profile_image", "image"),
            ("contacts", "email"),
            ("employer", "worksFor"),
            ("institution", "alumniOf"),
        ],
    )
    def test_omits_a_field_the_seed_does_not_supply(self, field, key):
        owner = replace(OWNER, **{field: () if field == "contacts" else None})
        person = build_json_ld(build_metadata(owner, HOST), "en")["@graph"][0]

        assert key not in person

    def test_omits_same_as_when_no_profile_is_seeded(self):
        owner = replace(OWNER, contacts=())
        person = build_json_ld(build_metadata(owner, HOST), "en")["@graph"][0]

        assert "sameAs" not in person


class TestInjectHead:
    def test_rewrites_the_title(self):
        assert "<title>Sam O'Toole | Staff Platform Engineer</title>" in inject_head(
            INDEX_HTML, METADATA
        )

    def test_escapes_markup_in_the_title(self):
        assert replace_title("<title>x</title>", "a<b&c") == "<title>a&lt;b&amp;c</title>"

    def test_adds_the_canonical_link(self):
        assert f'<link rel="canonical" href="https://{HOST}/" />' in inject_head(
            INDEX_HTML, METADATA
        )

    @pytest.mark.parametrize(
        "attribute",
        [
            'name="description"',
            'property="og:type" content="profile"',
            'property="og:title"',
            'property="og:description"',
            'property="og:url"',
            'property="og:image"',
            'property="og:image:width" content="1200"',
            'property="og:image:height" content="630"',
            'property="og:image:alt"',
            'name="twitter:card" content="summary_large_image"',
            'name="twitter:title"',
            'name="twitter:description"',
            'name="twitter:image"',
            'name="twitter:image:alt"',
        ],
    )
    def test_adds_each_social_tag(self, attribute):
        assert attribute in inject_head(INDEX_HTML, METADATA)

    def test_does_not_declare_a_locale(self):
        assert "og:locale" not in inject_head(INDEX_HTML, METADATA)

    def test_adds_the_json_ld_graph(self):
        graph = json_ld_of(inject_head(INDEX_HTML, METADATA))["@graph"]

        assert graph[0]["name"] == "Sam O'Toole"

    def test_escapes_a_less_than_sign_inside_the_json_ld(self):
        document = inject_head(INDEX_HTML, replace(METADATA, name="Sam </script><b>"))

        assert "<" not in json_ld_body(document)
        assert json_ld_of(document)["@graph"][0]["name"] == "Sam </script><b>"

    def test_takes_the_page_language_from_the_html_element(self):
        document = inject_head(INDEX_HTML.replace('lang="en"', 'lang="ga"'), METADATA)

        assert json_ld_of(document)["@graph"][1]["inLanguage"] == "ga"

    def test_puts_the_tags_inside_the_head(self):
        document = inject_head(INDEX_HTML, METADATA)

        assert document.index("og:title") < document.index("</head>")

    def test_replaces_the_block_a_previous_run_left(self):
        once = inject_head(INDEX_HTML, METADATA)

        assert inject_head(once, METADATA) == once

    def test_appends_the_block_when_the_document_has_no_head(self):
        assert "og:title" in inject_head("<html lang='en'><body></body></html>", METADATA)


class TestReadHtmlLang:
    def test_reads_the_declared_language(self):
        assert read_html_lang(INDEX_HTML) == "en"

    def test_falls_back_to_english_when_none_is_declared(self):
        assert read_html_lang("<html><head></head></html>") == "en"


class TestRenderRobotsTxt:
    def test_allows_every_named_crawler(self):
        robots = render_robots_txt(METADATA)

        for agent in ("*", "Googlebot", "Bingbot", "GPTBot", "ClaudeBot", "PerplexityBot"):
            assert f"User-agent: {agent}\nAllow: /\n" in robots

    def test_points_at_the_sitemap(self):
        assert render_robots_txt(METADATA).endswith(f"Sitemap: https://{HOST}/sitemap.xml\n")


class TestRenderSitemapXml:
    def test_lists_the_single_page_the_site_serves(self):
        sitemap = render_sitemap_xml(METADATA, "2026-09-06")

        assert sitemap.count("<url>") == 1
        assert f"<loc>https://{HOST}/</loc>" in sitemap
        assert "<lastmod>2026-09-06</lastmod>" in sitemap
