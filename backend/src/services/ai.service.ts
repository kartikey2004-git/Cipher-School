import { env } from "../config/env";

export interface AIHintRequest {
  question: string;
  userQuery: string;
  tableNames: string[];
  columnInfo: Array<{ table: string; columns: string[] }>;
  hintType: "syntax" | "logic" | "approach";
}

export interface AIHintResponse {
  hint: string;
  source: "rule-based" | "llm";
}

const buildPrompt = (request: AIHintRequest): string => {
  const tableContext = request.columnInfo
    .map((t) => `Table "${t.table}" has columns: ${t.columns.join(", ")}`)
    .join("\n");

  const typeInstructions: Record<string, string> = {
    syntax:
      "Focus only on SQL syntax issues in the user's query. Do NOT provide the full answer.",
    logic:
      "Help the user understand the logical approach needed. Do NOT write the complete SQL query.",
    approach:
      "Suggest a high-level strategy to solve the problem. Do NOT reveal the exact SQL solution.",
  };

  return `You are a SQL tutor helping a student solve a database problem.

RULES:
- NEVER provide the complete SQL solution
- NEVER write a query that fully answers the question
- Give a helpful hint that guides the student
- Keep your response under 150 words
- ${typeInstructions[request.hintType]}

PROBLEM:
${request.question}

AVAILABLE SCHEMA:
${tableContext}

STUDENT'S CURRENT QUERY:
${request.userQuery || "(no query written yet)"}

Provide a ${request.hintType} hint:`;
};

const generateRuleBasedHint = (request: AIHintRequest): string => {
  const { question, userQuery, tableNames, hintType } = request;
  const queryLower = (userQuery || "").toLowerCase();
  const questionLower = question.toLowerCase();
  const tables = tableNames.join(", ");

  if (hintType === "syntax") {
    if (!queryLower.includes("select")) {
      return "Remember that SQL queries usually start with the SELECT keyword. Make sure you're selecting the columns you need.";
    }
    if (!queryLower.includes("from")) {
      return `Don't forget the FROM clause to specify which table(s) you're querying from. Available tables: ${tables}`;
    }
    if (queryLower.includes("select *") && !queryLower.includes("where")) {
      return "Using SELECT * will return all columns. Consider specifying only the columns you need, and you might want to add a WHERE clause to filter results.";
    }
    if (
      queryLower.includes("where") &&
      !queryLower.includes("=") &&
      !queryLower.includes(">") &&
      !queryLower.includes("<")
    ) {
      return "Your WHERE clause needs a comparison operator like =, >, <, >=, <=, or LIKE to filter the results.";
    }
    return "Check your SQL syntax. Make sure all keywords are spelled correctly and that you have proper commas between column names.";
  }

  if (hintType === "logic") {
    if (questionLower.includes("average") || questionLower.includes("mean")) {
      return "For calculating averages, consider using the AVG() aggregate function. You might also need GROUP BY if you're averaging by categories.";
    }
    if (
      questionLower.includes("count") ||
      questionLower.includes("number of")
    ) {
      return "For counting records, use COUNT(*) or COUNT(column_name). COUNT(*) counts all rows, while COUNT(column) counts non-null values in that column.";
    }
    if (
      questionLower.includes("maximum") ||
      questionLower.includes("highest")
    ) {
      return "To find the maximum value, use the MAX() function. You might need to combine this with WHERE to filter specific groups first.";
    }
    if (questionLower.includes("minimum") || questionLower.includes("lowest")) {
      return "To find the minimum value, use the MIN() function. Consider what conditions you need to filter by first.";
    }
    if (questionLower.includes("join") || questionLower.includes("combine")) {
      return "When you need data from multiple tables, use JOIN operations. Common types are INNER JOIN, LEFT JOIN, and RIGHT JOIN. Make sure to specify the join condition with ON.";
    }
    return `Think about what the question is asking for. You have these tables available: ${tables}. Consider which columns you need and how they relate to each other.`;
  }

  if (hintType === "approach") {
    if (questionLower.includes("total") || questionLower.includes("sum")) {
      return "Start by identifying what you need to sum up. Use SUM() with the appropriate column, and consider if you need to group the results.";
    }
    if (
      questionLower.includes("group") ||
      questionLower.includes("each") ||
      questionLower.includes("per")
    ) {
      return "When you need results for each category, use GROUP BY. The columns in your SELECT statement (except aggregates) should match your GROUP BY columns.";
    }
    if (questionLower.includes("order") || questionLower.includes("sort")) {
      return "Use ORDER BY to sort your results. You can sort by multiple columns and specify ASC (default) or DESC for descending order.";
    }
    if (
      questionLower.includes("more than") ||
      questionLower.includes("greater than")
    ) {
      return "Use HAVING after GROUP BY to filter aggregated results, or use WHERE in combination with > for regular filtering.";
    }

    return `Break down the problem: 1) What columns do you need in the result? 2) What tables contain this data? 3) How do you filter or group the data? Available tables: ${tables}`;
  }

  return `Break down the problem: 1) What columns do you need in the result? 2) What tables contain this data? 3) How do you filter or group the data? Available tables: ${tables}`;
};

export const generateAIHint = async (
  request: AIHintRequest
): Promise<AIHintResponse> => {
  if (env.AI_API_KEY) {
    try {
      const prompt = buildPrompt(request);
      const hint = await callLLM(prompt);
      return { hint, source: "llm" };
    } catch (error) {
      console.warn(
        "LLM hint generation failed, falling back to rule-based:",
        error
      );
    }
  }

  const hint = generateRuleBasedHint(request);
  return { hint, source: "rule-based" };
};

const callLLM = async (prompt: string): Promise<string> => {
  throw new Error(
    "LLM provider not configured. Set AI_API_URL and AI_API_KEY."
  );
};

export { buildPrompt, generateRuleBasedHint };
