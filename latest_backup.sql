--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Debian 16.9-1.pgdg120+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'recruiter',
    'candidate'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: candidate_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate_comments (
    id integer NOT NULL,
    candidate_id integer,
    user_id integer,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.candidate_comments OWNER TO postgres;

--
-- Name: candidate_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidate_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_comments_id_seq OWNER TO postgres;

--
-- Name: candidate_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidate_comments_id_seq OWNED BY public.candidate_comments.id;


--
-- Name: candidate_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate_statuses (
    id integer NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#888888'::text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.candidate_statuses OWNER TO postgres;

--
-- Name: candidate_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidate_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_statuses_id_seq OWNER TO postgres;

--
-- Name: candidate_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidate_statuses_id_seq OWNED BY public.candidate_statuses.id;


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    users_id integer NOT NULL,
    phone character varying(50),
    "position" character varying(255),
    experience character varying(255),
    current_stage character varying(255),
    status character varying(50) DEFAULT 'actif'::character varying,
    cv_url character varying(255),
    last_interview_date timestamp with time zone,
    recruiter_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    salary_expectation character varying(255),
    cv_original_filename character varying(255)
);


ALTER TABLE public.candidates OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidates_id_seq OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    id integer NOT NULL,
    candidate_id integer,
    recruiter_id integer,
    scheduled_date timestamp with time zone NOT NULL,
    stage_id integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    duration integer
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- Name: interviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interviews_id_seq OWNER TO postgres;

--
-- Name: interviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interviews_id_seq OWNED BY public.interviews.id;


--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipeline_stages (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    stage_order integer NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pipeline_stages OWNER TO postgres;

--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pipeline_stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pipeline_stages_id_seq OWNER TO postgres;

--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pipeline_stages_id_seq OWNED BY public.pipeline_stages.id;


--
-- Name: recruiter_rights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruiter_rights (
    id integer NOT NULL,
    user_id integer NOT NULL,
    view_candidates boolean DEFAULT false,
    create_candidates boolean DEFAULT false,
    modify_candidates boolean DEFAULT false,
    view_interviews boolean DEFAULT false,
    create_interviews boolean DEFAULT false,
    modify_interviews boolean DEFAULT false,
    modify_statuses boolean DEFAULT false,
    modify_stages boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recruiter_rights OWNER TO postgres;

--
-- Name: recruiter_rights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruiter_rights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruiter_rights_id_seq OWNER TO postgres;

--
-- Name: recruiter_rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruiter_rights_id_seq OWNED BY public.recruiter_rights.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    firstname text,
    lastname text,
    email text NOT NULL,
    password text NOT NULL,
    role public.user_role NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: candidate_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_comments ALTER COLUMN id SET DEFAULT nextval('public.candidate_comments_id_seq'::regclass);


--
-- Name: candidate_statuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_statuses ALTER COLUMN id SET DEFAULT nextval('public.candidate_statuses_id_seq'::regclass);


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: interviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews ALTER COLUMN id SET DEFAULT nextval('public.interviews_id_seq'::regclass);


--
-- Name: pipeline_stages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages ALTER COLUMN id SET DEFAULT nextval('public.pipeline_stages_id_seq'::regclass);


--
-- Name: recruiter_rights id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_rights ALTER COLUMN id SET DEFAULT nextval('public.recruiter_rights_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: candidate_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate_comments (id, candidate_id, user_id, comment, created_at) FROM stdin;
1	1	2	Strong technical background. Good communication skills.	2025-07-15 13:27:33.132022+00
2	2	3	Impressive portfolio. Needs more experience with Figma.	2025-07-15 13:27:33.132022+00
\.


--
-- Data for Name: candidate_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate_statuses (id, name, color, is_default, is_active, created_at) FROM stdin;
1	New	#4CAF50	t	t	2025-07-15 13:27:33.12106+00
2	In Review	#2196F3	f	t	2025-07-15 13:27:33.12106+00
3	Interview	#9C27B0	f	t	2025-07-15 13:27:33.12106+00
4	Offer Sent	#FF9800	f	t	2025-07-15 13:27:33.12106+00
5	Hired	#009688	f	t	2025-07-15 13:27:33.12106+00
6	Rejected	#F44336	f	t	2025-07-15 13:27:33.12106+00
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates (id, users_id, phone, "position", experience, current_stage, status, cv_url, last_interview_date, recruiter_id, created_at, updated_at) FROM stdin;
1	4	+1234567890	Senior Developer	5+ years	Interview	active	cv_emma.pdf	\N	2	2025-07-15 13:27:33.128025+00	2025-07-15 13:27:33.128025+00
2	5	+1987654321	UX Designer	3+ years	Technical Test	active	cv_james.pdf	\N	3	2025-07-15 13:27:33.128025+00	2025-07-15 13:27:33.128025+00
\.


--
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (id, candidate_id, recruiter_id, scheduled_date, stage_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pipeline_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipeline_stages (id, name, description, stage_order, is_active, is_default, created_at) FROM stdin;
1	Sourced	Candidates identified but not yet contacted	1	t	t	2025-07-15 13:27:33.122777+00
2	Applied	Candidates who have applied	2	t	f	2025-07-15 13:27:33.122777+00
3	Phone Screen	Initial phone screening	3	t	f	2025-07-15 13:27:33.122777+00
4	Technical Test	Technical evaluation	4	t	f	2025-07-15 13:27:33.122777+00
5	Interview	Face to face interview	5	t	f	2025-07-15 13:27:33.122777+00
6	Offer	Offer extended	6	t	f	2025-07-15 13:27:33.122777+00
7	Hired	Successfully hired	7	t	f	2025-07-15 13:27:33.122777+00
\.


--
-- Data for Name: recruiter_rights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruiter_rights (id, user_id, view_candidates, create_candidates, modify_candidates, view_interviews, create_interviews, modify_interviews, modify_statuses, modify_stages, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, firstname, lastname, email, password, role, status, created_at, updated_at) FROM stdin;
1	John	Doe	admin@example.com	$2a$10$XFDq3lV7f3p/eHZ7MbGcrejkWfG7Dc.No2uEqL7y8MCXU2SO6J0nK	admin	active	2025-07-15 13:27:33.123909+00	2025-07-15 13:27:33.123909+00
2	Sarah	Johnson	recruiter1@example.com	$2a$10$XFDq3lV7f3p/eHZ7MbGcrejkWfG7Dc.No2uEqL7y8MCXU2SO6J0nK	recruiter	active	2025-07-15 13:27:33.125264+00	2025-07-15 13:27:33.125264+00
3	Michael	Brown	recruiter2@example.com	$2a$10$XFDq3lV7f3p/eHZ7MbGcrejkWfG7Dc.No2uEqL7y8MCXU2SO6J0nK	recruiter	active	2025-07-15 13:27:33.125264+00	2025-07-15 13:27:33.125264+00
4	Emma	Wilson	candidate1@example.com	$2a$10$XFDq3lV7f3p/eHZ7MbGcrejkWfG7Dc.No2uEqL7y8MCXU2SO6J0nK	candidate	active	2025-07-15 13:27:33.126457+00	2025-07-15 13:27:33.126457+00
5	James	Miller	candidate2@example.com	$2a$10$XFDq3lV7f3p/eHZ7MbGcrejkWfG7Dc.No2uEqL7y8MCXU2SO6J0nK	candidate	active	2025-07-15 13:27:33.126457+00	2025-07-15 13:27:33.126457+00
\.


--
-- Name: candidate_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidate_comments_id_seq', 2, true);


--
-- Name: candidate_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidate_statuses_id_seq', 6, true);


--
-- Name: candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidates_id_seq', 2, true);


--
-- Name: interviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_id_seq', 1, false);


--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pipeline_stages_id_seq', 7, true);


--
-- Name: recruiter_rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruiter_rights_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: candidate_comments candidate_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_comments
    ADD CONSTRAINT candidate_comments_pkey PRIMARY KEY (id);


--
-- Name: candidate_statuses candidate_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_statuses
    ADD CONSTRAINT candidate_statuses_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: recruiter_rights recruiter_rights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_rights
    ADD CONSTRAINT recruiter_rights_pkey PRIMARY KEY (id);


--
-- Name: recruiter_rights recruiter_rights_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_rights
    ADD CONSTRAINT recruiter_rights_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: candidate_comments candidate_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_comments
    ADD CONSTRAINT candidate_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: candidates candidates_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id);


--
-- Name: candidates candidates_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interviews interviews_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id);


--
-- Name: interviews interviews_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id);


--
-- Name: recruiter_rights recruiter_rights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_rights
    ADD CONSTRAINT recruiter_rights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

