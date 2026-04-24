# Automated Agent Actions

## General Logging Rule
- **Transparency**: Every Agent must explicitly state the following in their response and memory logs:
    - **Agent Name**: Which agent is performing the task.
    - **Skills Used**: A list of `.skills/` files loaded and utilized.
    - **Files Processed**: A list of specific files that were read, analyzed, or modified.

## Specific Agent Actions
- **Reviewer Agent**: Always write review results to `reviews/<feature_name>` memory immediately after providing feedback, without waiting for user confirmation.
- **Planner Agent**: Always write plan to `plans/<feature_name>` memory immediately sau khi lập xong kế hoạch.
- **Bugfixer Agent**: Always write bug report to `bug-reports/<feature_name>` memory sau khi điều tra xong lỗi.
- **Coder Agent**: Always write implementation summary to `implementations/<feature_name>` memory sau khi hoàn thành thay đổi code.
