--
-- PostgreSQL database dump
--

-- Dumped from database version 13.3
-- Dumped by pg_dump version 14.1 (Ubuntu 14.1-2.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AlbumType; Type: TABLE; Schema: public; Owner: adminrs
--

CREATE TABLE public."AlbumType" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE public."AlbumType" OWNER TO adminrs;

--
-- Name: Albums; Type: TABLE; Schema: public; Owner: adminrs
--

CREATE TABLE public."Albums" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200),
    "releaseDate" timestamp with time zone,
    "typeId" uuid
);


ALTER TABLE public."Albums" OWNER TO adminrs;

--
-- Name: Artists; Type: TABLE; Schema: public; Owner: adminrs
--

CREATE TABLE public."Artists" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL
);


ALTER TABLE public."Artists" OWNER TO adminrs;

--
-- Name: Tracks; Type: TABLE; Schema: public; Owner: adminrs
--

CREATE TABLE public."Tracks" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying,
    "albumId" uuid,
    duration integer NOT NULL,
    "discNumber" integer NOT NULL,
    "trackNumber" integer NOT NULL
);


ALTER TABLE public."Tracks" OWNER TO adminrs;

--
-- Name: TracksArtists; Type: TABLE; Schema: public; Owner: adminrs
--

CREATE TABLE public."TracksArtists" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "trackId" uuid NOT NULL,
    "artistId" uuid NOT NULL
);


ALTER TABLE public."TracksArtists" OWNER TO adminrs;

--
-- Data for Name: AlbumType; Type: TABLE DATA; Schema: public; Owner: adminrs
--

COPY public."AlbumType" (id, type) FROM stdin;
b3c0555d-301d-4625-b981-1e5999c10dd4	album
0220c0da-d0b8-4cde-b095-740b792cc0d2	single
6010b9c0-a4b6-4557-aec8-5dcc2bf0fc35	compilation
\.


--
-- Data for Name: Albums; Type: TABLE DATA; Schema: public; Owner: adminrs
--

COPY public."Albums" (id, title, "releaseDate", "typeId") FROM stdin;
86928e0e-f83f-4554-9162-9e86bb93e51b	Ecliptica	1999-09-20 21:37:03.149+00	b3c0555d-301d-4625-b981-1e5999c10dd4
0cdca64d-8c4f-4ac6-a5b8-f78b0816a974	New Title	2022-01-10 21:37:03.149+00	b3c0555d-301d-4625-b981-1e5999c10dd4
\.


--
-- Data for Name: Artists; Type: TABLE DATA; Schema: public; Owner: adminrs
--

COPY public."Artists" (id, name) FROM stdin;
c874fe03-094c-47d3-81f2-160ff250f724	Slash
2cb036f3-46f6-4a95-9007-0f57714285c9	Kirk Hammet
b21a841f-bb95-468c-9a7b-e3d8bcbac33d	James Hetfield
0e272168-2bd9-4a89-b3bf-522a6d8027de	Lars Ulrich
2e215ed2-2ea9-4ea7-a162-a634e7987799	Tommy Portimo
cd4cd203-8c85-4c61-8268-cc00047b4469	Jani Leematainen
543ab7d6-0639-4a75-a1f6-5cd114267283	Tony Kakko
\.


--
-- Data for Name: Tracks; Type: TABLE DATA; Schema: public; Owner: adminrs
--

COPY public."Tracks" (id, title, "albumId", duration, "discNumber", "trackNumber") FROM stdin;
a1366189-efda-4e07-8491-f50f992662c6	Kingdom for a Heart	86928e0e-f83f-4554-9162-9e86bb93e51b	530	1	3
fab146fd-3c14-4e94-bddd-4c7e50cc3be1	Full Moon	86928e0e-f83f-4554-9162-9e86bb93e51b	100	2	10
3a40583d-9630-4f46-a4c3-5446204f0d55	Paid in Full	0cdca64d-8c4f-4ac6-a5b8-f78b0816a974	350	1	3
5f6f6158-eae0-4f30-bdac-8a41768e102e	Shamandalie	0cdca64d-8c4f-4ac6-a5b8-f78b0816a974	475	1	2
\.


--
-- Data for Name: TracksArtists; Type: TABLE DATA; Schema: public; Owner: adminrs
--

COPY public."TracksArtists" (id, "trackId", "artistId") FROM stdin;
6b591e8e-c828-4881-880e-9b3e3ebd2ce0	fab146fd-3c14-4e94-bddd-4c7e50cc3be1	2e215ed2-2ea9-4ea7-a162-a634e7987799
40960a13-c1b8-4cc0-bc07-ed9d1089c99c	fab146fd-3c14-4e94-bddd-4c7e50cc3be1	cd4cd203-8c85-4c61-8268-cc00047b4469
a76fc23b-3a03-4ee3-a950-8f8cdfb1fca5	fab146fd-3c14-4e94-bddd-4c7e50cc3be1	543ab7d6-0639-4a75-a1f6-5cd114267283
53136c3f-0b6c-4551-99bf-44968c2af5e7	a1366189-efda-4e07-8491-f50f992662c6	2e215ed2-2ea9-4ea7-a162-a634e7987799
73bc3388-2c47-4bd7-b073-1d083c644ae8	a1366189-efda-4e07-8491-f50f992662c6	543ab7d6-0639-4a75-a1f6-5cd114267283
0ec3f102-1f4a-43f7-99ce-ea9e84976841	3a40583d-9630-4f46-a4c3-5446204f0d55	2e215ed2-2ea9-4ea7-a162-a634e7987799
6ccefe2a-d5c3-4331-a900-7b0f2539c0b8	3a40583d-9630-4f46-a4c3-5446204f0d55	543ab7d6-0639-4a75-a1f6-5cd114267283
e65a56ff-cdd0-4996-b8ea-2b39a52b5450	5f6f6158-eae0-4f30-bdac-8a41768e102e	2e215ed2-2ea9-4ea7-a162-a634e7987799
5ee39d19-ad9c-430b-a4ac-a5cd9a6ba6b0	5f6f6158-eae0-4f30-bdac-8a41768e102e	543ab7d6-0639-4a75-a1f6-5cd114267283
\.


--
-- Name: AlbumType AlbumType_pkey; Type: CONSTRAINT; Schema: public; Owner: adminrs
--

ALTER TABLE ONLY public."AlbumType"
    ADD CONSTRAINT "AlbumType_pkey" PRIMARY KEY (id);


--
-- Name: Albums Albums_pkey; Type: CONSTRAINT; Schema: public; Owner: adminrs
--

ALTER TABLE ONLY public."Albums"
    ADD CONSTRAINT "Albums_pkey" PRIMARY KEY (id);


--
-- Name: Artists Artists_pkey; Type: CONSTRAINT; Schema: public; Owner: adminrs
--

ALTER TABLE ONLY public."Artists"
    ADD CONSTRAINT "Artists_pkey" PRIMARY KEY (id);


--
-- Name: TracksArtists TracksArtists_pkey; Type: CONSTRAINT; Schema: public; Owner: adminrs
--

ALTER TABLE ONLY public."TracksArtists"
    ADD CONSTRAINT "TracksArtists_pkey" PRIMARY KEY (id);


--
-- Name: Tracks Tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: adminrs
--

ALTER TABLE ONLY public."Tracks"
    ADD CONSTRAINT "Tracks_pkey" PRIMARY KEY (id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: adminrs
--

REVOKE ALL ON SCHEMA public FROM rdsadmin;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO adminrs;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

