interface Usage {
  id: number;
  quota_id: number;
  times_consumed: number;
  tokens_consumed: number;
}

export interface UsageWithQuota extends Usage {
  quota: {
    id: number;
    providers: number[];
    times_limit: number;
    tokens_limit: number;
  };
}
