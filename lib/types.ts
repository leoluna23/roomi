export type Profile = {
    id?: string;
    name: string;
    major?: string;
    bio?: string;
    sleep_sched?: "early" | "normal" | "late";
    cleanliness?: "low" | "medium" | "high";
    noise?: "quiet" | "moderate" | "loud";
    guests?: "rare" | "sometimes" | "often";
    budget_min?: number;
    budget_max?: number;
    interests?: string[];
  };
  
  export type Member = { id: string; 
    user_name: string;
    availability?: {day:number;start:string;end:string;}[]
  };

  export type Chore = { id: string;
    title: string;
    freq: "daily" | "every_other_day" | "weekly" | "biweekly" | "monthly";
    preferred_day?: number;
    preferred_time?: string;
    duration_min?: number;
    notes?: string;
    start_date?: string; // ISO date string (YYYY-MM-DD)
    end_date?: string; // ISO date string (YYYY-MM-DD)
  };

  export type Assignment = { id?: string; 
    chore_id: string;
    member_id: string;
    when_ts: string;
    };
  