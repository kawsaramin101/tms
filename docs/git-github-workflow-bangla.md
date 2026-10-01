# Git & GitHub Workflow

সবাই একই GitHub repository-তে কাজ করবে।

**সরাসরি `main` branch-এ কোনো code push করা যাবে না।**

প্রতিটি feature বা task-এর জন্য আলাদা branch তৈরি করে সেখানে কাজ করতে হবে। কাজ শেষ হলে `Pull Request (PR)` তৈরি করতে হবে।

## ধাপ ১ — Project নেওয়া

### যদি এখনো project clone না করে থাকো

প্রথমে repository clone করো:

```bash
git clone https://github.com/kawsaramin101/tms.git
cd tms
```

### যদি আগে থেকেই project clone করা থাকে

কাজ শুরু করার আগে `main` থেকে সর্বশেষ পরিবর্তনগুলো নিয়ে নাও:

```bash
git checkout main
git pull origin main
```

## ধাপ ২ — নিজের branch তৈরি করা

প্রতিটি feature বা task-এর জন্য আলাদা branch তৈরি করো:

```bash
git checkout -b feature/<your-feature>
```

উদাহরণ:

```bash
git checkout -b feature/member-management
git checkout -b feature/voucher-upload
git checkout -b feature/transaction-api
git checkout -b feature/notification-system
```

**একটি branch = একটি feature/task**

## ধাপ ৩ — নিজের feature নিয়ে কাজ করা

তোমার assigned module-এর মধ্যেই মূলত কাজ করো।

উদাহরণ:

```text
apps/backend/src/modules/members-fees/
```

অথবা:

```text
apps/frontend/src/modules/members-fees/
```

অন্য team-এর module অপ্রয়োজনীয়ভাবে পরিবর্তন করবে না।

## ধাপ ৪ — পরিবর্তনগুলো দেখো

কী কী পরিবর্তন হয়েছে তা দেখতে:

```bash
git status
```

কাজ করার সময় নিশ্চিত হও যে ভুল করে অন্য কোনো file পরিবর্তন করোনি।

## ধাপ ৫ — Commit করা

পরিবর্তনগুলো commit করো:

```bash
git add .
git commit -m "feat: add member management"
```

Commit message পরিষ্কার এবং কাজের সাথে সম্পর্কিত রাখো।

উদাহরণ:

```text
feat: add member management
feat: add voucher upload
feat: add transaction API
fix: validate transaction amount
refactor: simplify transaction service
docs: update project documentation
```

## ধাপ ৬ — নিজের branch GitHub-এ push করা

নিজের branch GitHub-এ push করো:

```bash
git push -u origin feature/<your-feature>
```

উদাহরণ:

```bash
git push -u origin feature/member-management
```

## ধাপ ৭ — Pull Request তৈরি করা

Push করার পর GitHub-এ:

1. Repository-তে যাও।
2. **Pull Request** তৈরি করো।
3. তোমার branch থেকে `main` branch-এ PR তৈরি করো।
4. কী কী পরিবর্তন করেছো তা লিখে দাও।
5. একজন teammate-কে review করতে বলো।
6. Review শেষ হওয়ার পর PR merge করা হবে।

## সংক্ষেপে

প্রতিবার নতুন কাজ শুরু করার সময়:

```bash
git checkout main
git pull origin main

git checkout -b feature/my-feature
```

তারপর নিজের কাজ করো।

কাজ শেষ হলে:

```bash
git add .
git commit -m "feat: describe your change"
git push -u origin feature/my-feature
```

তারপর GitHub-এ **Pull Request → `main`** তৈরি করো।

**মনে রাখবে:**

> `main` → সরাসরি কাজ বা push করা যাবে না  
> `feature/...` → নিজের কাজ করার branch  
> `Pull Request` → কাজ review করার মাধ্যমে `main`-এ যোগ করা হবে