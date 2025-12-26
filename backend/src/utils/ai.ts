import { prisma } from "../app.js";
import logger from "./logger.js";

type CreateTaskResponse = {
  code?: number; // 错误码
  message?: string; // 错误信息
  request_id: string;
  usage: object;
  output: {
    dataId: string; // 任务ID
  };
};

type GetTaskResponse = {
  request_id: string;
  usage: object;
  output: {
    status: number; // 0成功 1处理中 2失败
    errorCode?: number;
    errorMessage?: string;
    autoChaptersPath: string; // 章节速览的ossUrl
    meetingAssistancePath: string; // 待办事项、关键词的ossUrl
    playbackUrl: string; // 回听音频url，有效期是24h
    pptExtractionPath: string; // PPT抽取及摘要的ossUrl
    summarizationPath: string; // 全文摘要、发言总结、问答回顾、思维导图的ossUrl
    textPolishPath: string; // 	口语书面化的ossUrl
    transcriptionPath: string; // 转写结果对象的ossUrl
    translationsPath: string; // 翻译的ossUrl
    customPromptPath?: string; // 自定义问答的ossUrl
  };
};

type TextPolishResponse = Array<{
  formalParagraphText: string;
  sentenceIds: Array<number>;
  paragraphId: string;
  start: number;
  end: number;
}>;

type ParagraphSummaryTopic = {
  title: string;
  beginTime?: number;
  topic: Array<ParagraphSummaryTopic>; // 递归嵌套子主题
};

type ParagraphSummary = {
  paragraphSummary: string;
  conversationalSummary: Array<{
    speakerId: string;
    speakerName: string;
    summary: string;
  }>;
  questionsAnsweringSummary: Array<{
    question: string;
    sentenceIdsOfQuestion: Array<number>;
    answer: string;
    sentenceIdsOfAnswer: Array<number>;
  }>;
  mindMapSummary: Array<ParagraphSummaryTopic>;
};

export type ProcessResult = {
  summary: string;
  content: string;
  speakers: string[];
  keypoints: Array<{
    time_point: number;
    content: string;
    speaker: string;
  }>;
};

export async function aiProcessFile(
  fileUrl: string,
  recordId: string
): Promise<ProcessResult> {
  logger.info(
    "Starting AI processing for file: %s, recordId: %s",
    fileUrl,
    recordId
  );
  // 创建任务
  const createResponse = await createTask(fileUrl);
  if (createResponse?.code !== undefined) {
    throw new Error(`Tingwu createTask failed: ${createResponse.message}`);
  }
  const dataId = createResponse.output.dataId;
  const maxRetries = 100;
  let retries = 0;
  let taskResponse;
  // 轮询获取任务结果
  while (retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒
    taskResponse = await getTask(dataId);
    if (taskResponse.output.status === 0) {
      break;
    } else if (taskResponse.output.status === 2) {
      throw new Error(
        `Tingwu getTask failed: ${taskResponse.output.errorMessage}`
      );
    }
    retries++;
  }
  if (retries === maxRetries) {
    throw new Error("Tingwu getTask timed out");
  }

  // 解析结果并存储到数据库或文件系统
  if (!taskResponse?.output.textPolishPath) {
    throw new Error("Tingwu task has no textPolishPath");
  }

  const summarizationResult = await handleSummarization(
    taskResponse.output.summarizationPath
  );

  let result: ProcessResult = {
    summary: "",
    content: "",
    speakers: [],
    keypoints: [],
  };

  let result_parts = summarizationResult.paragraphSummary.split("@#");
  result.summary = result_parts[0]?.trim();
  result.content = result_parts[1]?.trim();

  for (const speaker of summarizationResult.conversationalSummary) {
    if (!result.speakers.includes(speaker.speakerName)) {
      result.speakers.push(speaker.speakerName);
    }

    result.keypoints.push({
      time_point: 0,
      content: speaker.summary,
      speaker: speaker.speakerName,
    });
  }
  return result;
}

// 创建任务
export async function createTask(fileUrl: string): Promise<CreateTaskResponse> {
  const url =
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
  const data = {
    model: "tingwu-meeting",
    input: {
      task: "createTask",
      type: "offline",
      appId: process.env.TINGWU_APP_ID,
      fileUrl,
    },
    parameters: {
      transcription: {
        model: "cn",
        diarizationEnabled: true,
        diarizationSpeakerCount: 0,
        translationEnabled: true,
        translationTargetLang: ["en"],
      },
      analysis: {
        model: "default",
        keyInformationEnabled: true,
        actionsEnabled: true,
        fullSummaryEnabled: true,
        fullSummaryFormat: "markdown",
        conversationalEnabled: true,
        questionsAnsweringEnabled: true,
        mindMapEnabled: true,
        mindMapFormat: "timestamp",
        pptExtractionEnabled: true,
        autoChaptersEnabled: true,
        autoChapterGranularity: "Coarse",
        autoChapterTitleLengthLevel: "Short",
        textPolishEnabled: true,
        customPromptEnabled: false,
        customPromptModel: "tingwu-turbo",
        customPromptTransType: "default",
        customPromptContent: "{Transcription}推测前面的对话有几个人",
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TINGWU_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // 将对象转换为 JSON 字符串
  });

  return await response.json();
}

// 多模态生成
export async function getTask(dataId: string): Promise<GetTaskResponse> {
  const url =
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
  const data = {
    model: "tingwu-meeting",
    input: {
      task: "getTask",
      dataId,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TINGWU_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // 将对象转换为 JSON 字符串
  });

  return await response.json();
}

// 处理文本书面化
export async function handleTextPolish(
  url: string
): Promise<TextPolishResponse> {
  const response = await fetch(url, {
    method: "GET",
  });

  return await response.json();
}

// 处理段落总结
export async function handleSummarization(
  url: string
): Promise<ParagraphSummary> {
  const response = await fetch(url, {
    method: "GET",
  });

  return await response.json();
}
