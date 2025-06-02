-- Stage 1
ALTER TABLE IF EXISTS public."Competitions"
    ADD COLUMN invited_friend_email TEXT,
    ADD COLUMN invited_friend_name TEXT,
    ADD COLUMN invite_accepted BOOLEAN DEFAULT FALSE,
    ADD COLUMN invite_url TEXT;

CREATE SEQUENCE IF NOT EXISTS public."Winners_id_seq"
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;


CREATE TABLE IF NOT EXISTS public."Winners"
(
    id integer NOT NULL DEFAULT nextval('"Winners_id_seq"'::regclass),
    contest_id integer NOT NULL,
    competition_id integer NOT NULL,
    user_id integer,
    winning_amount numeric(10,2) DEFAULT 0,
    "position" integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "Winners_pkey" PRIMARY KEY (id),
    CONSTRAINT "Winners_competition_id_fkey" FOREIGN KEY (competition_id)
        REFERENCES public."Competitions" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT "Winners_contest_id_fkey" FOREIGN KEY (contest_id)
        REFERENCES public."Contests" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "Winners_user_id_fkey" FOREIGN KEY (user_id)
        REFERENCES public."Users" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

ALTER SEQUENCE public."Winners_id_seq"
    OWNED BY public."Winners".id;


-- Stage 2
ALTER TABLE IF EXISTS public."Users"
    ADD COLUMN age_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public."Alerts"
    ADD COLUMN is_seen boolean DEFAULT false;
    ADD COLUMN is_deleted boolean DEFAULT false;
    ADD COLUMN title text;

ALTER TABLE IF EXISTS public."Contests"
    ADD COLUMN notify_users boolean DEFAULT false;

ALTER TABLE IF EXISTS public."Alerts"
    RENAME created_at TO "createdAt";

ALTER TABLE IF EXISTS public."Alerts"
    ADD COLUMN "updatedAt" timestamp without time zone DEFAULT now();

CREATE SEQUENCE IF NOT EXISTS public."WeeklyTopVoters_id_seq"
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE TABLE IF NOT EXISTS public."WeeklyTopVoters"
(
    id integer NOT NULL DEFAULT nextval('"WeeklyTopVoters_id_seq"'::regclass),
    user_id integer,
    winning_amount numeric(10,2) DEFAULT 0,
    "position" integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "WeeklyTopVoters_pkey" PRIMARY KEY (id),
    CONSTRAINT "WeeklyTopVoters_user_id_fkey" FOREIGN KEY (user_id)
        REFERENCES public."Users" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

ALTER SEQUENCE public."WeeklyTopVoters_id_seq"
    OWNED BY public."WeeklyTopVoters".id;

CREATE SEQUENCE IF NOT EXISTS public."weeklyTopReferrers_id_seq"
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE TABLE IF NOT EXISTS public."weeklyTopReferrers"
(
    id integer NOT NULL DEFAULT nextval('"weeklyTopReferrers_id_seq"'::regclass),
    user_id integer,
    winning_amount numeric(10,2) DEFAULT 0,
    "position" integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "weeklyTopReferrers_pkey" PRIMARY KEY (id),
    CONSTRAINT "weeklyTopReferrers_user_id_fkey" FOREIGN KEY (user_id)
        REFERENCES public."Users" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

ALTER SEQUENCE public."weeklyTopReferrers_id_seq"
    OWNED BY public."weeklyTopReferrers".id;

ALTER TABLE IF EXISTS public."weeklyTopReferrers"
    RENAME TO "WeeklyTopReferrers";