interface Usage {
  id: number;
  quota_id: number;
  times_consumed: number;
  tokens_consumed: number;
}

export interface UsageWithQuota extends Usage {
  quota: {
    id: number;
    provider_id: number;
    times_limit: number;
    token_limit: number;
  };
}
