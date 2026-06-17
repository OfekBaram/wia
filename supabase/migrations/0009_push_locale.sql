-- 0009: remember each push subscriber's language so match/message
-- notifications are sent in Hebrew or English to match what they picked.

alter table push_subscriptions
  add column if not exists locale text not null default 'en';
