--
-- PostgreSQL database dump
--

\restrict Pa9m2nb5cyJx2cA3tWBdTdedFXDhTAyKJExTGPGEot5crqQGqMesUdC9tV8lEyX

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    city text,
    birth_date date,
    birth_time time without time zone,
    death_date date,
    phone text,
    email text,
    relationship_type text,
    gender text,
    birth_place text,
    birth_latitude double precision,
    birth_longitude double precision,
    birth_timezone text,
    notes text,
    notification_days integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: daily_forecasts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_forecasts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    arcana_number integer NOT NULL,
    arcana_name text NOT NULL,
    bazi_element text NOT NULL,
    has_warning boolean DEFAULT false NOT NULL,
    synthesis_text text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_forecasts OWNER TO postgres;

--
-- Name: daily_forecasts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_forecasts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_forecasts_id_seq OWNER TO postgres;

--
-- Name: daily_forecasts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_forecasts_id_seq OWNED BY public.daily_forecasts.id;


--
-- Name: dreams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dreams (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    dream_text text NOT NULL,
    interpretation text NOT NULL,
    keywords text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dreams OWNER TO postgres;

--
-- Name: dreams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dreams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dreams_id_seq OWNER TO postgres;

--
-- Name: dreams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dreams_id_seq OWNED BY public.dreams.id;


--
-- Name: family_connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_connections (
    id integer NOT NULL,
    user_id integer NOT NULL,
    contact_id_1 integer NOT NULL,
    contact_id_2 integer NOT NULL,
    connection_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.family_connections OWNER TO postgres;

--
-- Name: family_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_connections_id_seq OWNER TO postgres;

--
-- Name: family_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_connections_id_seq OWNED BY public.family_connections.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    user_id integer NOT NULL,
    forecast_id integer NOT NULL,
    date date NOT NULL,
    accuracy text NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO postgres;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: life_journals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.life_journals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    marriage_date date,
    divorce_date date,
    marriages jsonb DEFAULT '[]'::jsonb NOT NULL,
    children jsonb DEFAULT '[]'::jsonb NOT NULL,
    relocations jsonb DEFAULT '[]'::jsonb NOT NULL,
    job_changes jsonb DEFAULT '[]'::jsonb NOT NULL,
    losses jsonb DEFAULT '[]'::jsonb NOT NULL,
    height_cm integer,
    weight_kg integer,
    blood_type text,
    chronic_conditions text,
    allergies text,
    smoking boolean,
    fears text,
    last_menstruation_date date,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.life_journals OWNER TO postgres;

--
-- Name: life_journals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.life_journals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.life_journals_id_seq OWNER TO postgres;

--
-- Name: life_journals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.life_journals_id_seq OWNED BY public.life_journals.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    author_name text NOT NULL,
    author_avatar text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notepad_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notepad_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    ref_key text,
    text text DEFAULT ''::text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notepad_items OWNER TO postgres;

--
-- Name: notepad_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notepad_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notepad_items_id_seq OWNER TO postgres;

--
-- Name: notepad_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notepad_items_id_seq OWNED BY public.notepad_items.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    task_type text NOT NULL,
    task_text text NOT NULL,
    target_value integer DEFAULT 0 NOT NULL,
    actual_value integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    is_daily_goal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: travels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travels (
    id integer NOT NULL,
    user_id integer NOT NULL,
    country_code text NOT NULL,
    country_name text NOT NULL,
    visited boolean DEFAULT false NOT NULL,
    wishlist boolean DEFAULT false NOT NULL,
    visited_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.travels OWNER TO postgres;

--
-- Name: travels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travels_id_seq OWNER TO postgres;

--
-- Name: travels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travels_id_seq OWNED BY public.travels.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    clerk_user_id text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    city text,
    city_latitude double precision,
    city_longitude double precision,
    city_timezone text,
    birth_date date,
    birth_time text,
    birth_place text,
    birth_latitude double precision,
    birth_longitude double precision,
    birth_timezone text,
    photo_path text,
    bed_direction text,
    avatar_type text,
    notifications_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: daily_forecasts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_forecasts ALTER COLUMN id SET DEFAULT nextval('public.daily_forecasts_id_seq'::regclass);


--
-- Name: dreams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dreams ALTER COLUMN id SET DEFAULT nextval('public.dreams_id_seq'::regclass);


--
-- Name: family_connections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_connections ALTER COLUMN id SET DEFAULT nextval('public.family_connections_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: life_journals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_journals ALTER COLUMN id SET DEFAULT nextval('public.life_journals_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notepad_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notepad_items ALTER COLUMN id SET DEFAULT nextval('public.notepad_items_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: travels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travels ALTER COLUMN id SET DEFAULT nextval('public.travels_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, user_id, name, city, birth_date, birth_time, death_date, phone, email, relationship_type, gender, birth_place, birth_latitude, birth_longitude, birth_timezone, notes, notification_days, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: daily_forecasts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_forecasts (id, user_id, date, arcana_number, arcana_name, bazi_element, has_warning, synthesis_text, payload, created_at) FROM stdin;
\.


--
-- Data for Name: dreams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dreams (id, user_id, date, dream_text, interpretation, keywords, created_at) FROM stdin;
\.


--
-- Data for Name: family_connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_connections (id, user_id, contact_id_1, contact_id_2, connection_type, created_at) FROM stdin;
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, user_id, forecast_id, date, accuracy, comment, created_at) FROM stdin;
\.


--
-- Data for Name: life_journals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.life_journals (id, user_id, marriage_date, divorce_date, marriages, children, relocations, job_changes, losses, height_cm, weight_kg, blood_type, chronic_conditions, allergies, smoking, fears, last_menstruation_date, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, user_id, author_name, author_avatar, body, created_at) FROM stdin;
\.


--
-- Data for Name: notepad_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notepad_items (id, user_id, date, source, ref_key, text, done, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, user_id, date, task_type, task_text, target_value, actual_value, is_completed, is_daily_goal, created_at) FROM stdin;
\.


--
-- Data for Name: travels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.travels (id, user_id, country_code, country_name, visited, wishlist, visited_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, clerk_user_id, name, city, city_latitude, city_longitude, city_timezone, birth_date, birth_time, birth_place, birth_latitude, birth_longitude, birth_timezone, photo_path, bed_direction, avatar_type, notifications_enabled, created_at) FROM stdin;
\.


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 1, false);


--
-- Name: daily_forecasts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_forecasts_id_seq', 1, false);


--
-- Name: dreams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dreams_id_seq', 1, false);


--
-- Name: family_connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.family_connections_id_seq', 1, false);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_id_seq', 1, false);


--
-- Name: life_journals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.life_journals_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notepad_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notepad_items_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: travels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.travels_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: daily_forecasts daily_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_forecasts
    ADD CONSTRAINT daily_forecasts_pkey PRIMARY KEY (id);


--
-- Name: dreams dreams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dreams
    ADD CONSTRAINT dreams_pkey PRIMARY KEY (id);


--
-- Name: family_connections family_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_connections
    ADD CONSTRAINT family_connections_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: life_journals life_journals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_journals
    ADD CONSTRAINT life_journals_pkey PRIMARY KEY (id);


--
-- Name: life_journals life_journals_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_journals
    ADD CONSTRAINT life_journals_user_id_unique UNIQUE (user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notepad_items notepad_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notepad_items
    ADD CONSTRAINT notepad_items_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: travels travels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travels
    ADD CONSTRAINT travels_pkey PRIMARY KEY (id);


--
-- Name: users users_clerk_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);


--
-- Name: notepad_auto_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX notepad_auto_unique ON public.notepad_items USING btree (user_id, date, source, ref_key) WHERE (source <> 'manual'::text);


--
-- PostgreSQL database dump complete
--

\unrestrict Pa9m2nb5cyJx2cA3tWBdTdedFXDhTAyKJExTGPGEot5crqQGqMesUdC9tV8lEyX

