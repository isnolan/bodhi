import * as path from 'path';
import * as dotenv from 'dotenv';
import { Provider } from '@/types';
import { ChatAPI } from '@/api';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('chat', () => {
  beforeEach(() => {
    if (!process.env.HTTP_PROXY || !process.env.MOONSHOT_API_KEY) {
      console.log('Skipping test due to missing environment variables');
      return;
    }
  });

  const api = new ChatAPI(Provider.MOONSHOT_KIMI, {
    apiKey: process.env?.MOONSHOT_API_KEY as string,
  });

  // 发送聊天消息
  it('text: streaming', async () => {
    const res = await api.sendMessage({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', parts: [{ type: 'text', text: '你是一位资深的儿童作家，擅长写作高情商儿童故事' }] },
        { role: 'user', parts: [{ type: 'text', text: '白雪公主与七个小矮人' }] },
        {
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: '《白雪公主与七个小矮人》（Snow White and the Seven Dwarfs）是一部经典的童话故事，由格林兄弟（Jacob and Wilhelm Grimm）在19世纪初收集并编纂。这部作品后来被华特·迪士尼（Walt Disney）改编成了同名的动画电影，于1937年上映，成为世界上第一部长篇动画电影。\n\n故事讲述了一个美丽的公主——白雪公主，她的皮肤白如雪，唇红如血，头发黑如乌。她的继母，也就是邪恶的皇后，非常嫉妒白雪公主的美貌，经常向魔镜询问谁是这个世界上最美丽的女人。当魔镜回答白雪公主比皇后更美时，皇后便密谋杀害白雪公主。然而，白雪公主每次都能侥幸逃脱。\n\n在一次险些被杀的事件中，白雪公主逃到了森林里，结识了七个小矮人。这些小矮人非常善良，收留了白雪公主，并教会了她如何生活在森林中。然而，皇后通过魔镜得知白雪公主仍然活着，于是她化妆成一个老妇人，三次试图杀死白雪公主。前两次都被小矮人发现并救回了白雪公主，但第三次，皇后给了一个有毒的苹果，白雪公主咬了一口就昏迷不醒。\n\n小矮人找不到救治白雪公主的方法，便为她制作了一个透明的水晶棺，将她安放其中。一位英俊的王子路过，看到了美丽的白雪公主，情不自禁地吻了她。这个吻解除了毒药的魔咒，白雪公主苏醒过来。最后，白雪公主与王子结婚，过上了幸福的生活，而邪恶的皇后则受到了应有的惩罚。这个故事传达了善良、友谊、爱情和正义终将战胜邪恶的主题。',
            },
          ],
        },
        { role: 'user', parts: [{ type: 'text', text: '再来一个英文版本的？' }] },
        // { role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      // n: 2,
      // stream: false,
      onProgress: (choices) => {
        console.log(`[kimi]process`, JSON.stringify(choices));
        expect(choices).toBeInstanceOf(Object);
      },
    });
    console.log(`[kimi]result`, JSON.stringify(res, null, 2));
    expect(res).toBeInstanceOf(Object);
  }, 50000);

  // vision: image part, from inline data
  // it('vision:image from inline data', async () => {
  //   const res = await api.sendMessage({
  //     model: 'gpt-4-vision-preview',
  //     max_tokens: 1000,
  //     messages: [
  //       {
  //         role: 'user',
  //         parts: [
  //           { type: 'text', text: 'Describe this image' },
  //           {
  //             type: 'image',
  //             url: 'https://miro.medium.com/v2/resize:fit:720/format:jpeg/1*YMJDp-kqus7i-ktWtksNjg.jpeg',
  //           },
  //         ],
  //       },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[openai]progress:`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[openai]result:`, JSON.stringify(res, null, 2));
  //   expect(res).toBeInstanceOf(Object);
  // }, 20000);

  // function call
  // it('function call', async () => {
  //   const result = await api.sendMessage({
  //     model: 'gpt-3.5-turbo-1106',
  //     messages: [
  //       {
  //         role: 'user',
  //         parts: [{ type: 'text', text: 'Which theaters in Mountain View show Barbie movie?' }],
  //       },
  //     ],
  //     tools: [
  //       {
  //         type: 'function',
  //         function: {
  //           name: 'find_theaters',
  //           description:
  //             'find theaters based on location and optionally movie title which are is currently playing in theaters',
  //           parameters: {
  //             type: 'object',
  //             properties: {
  //               location: {
  //                 type: 'string',
  //                 description: 'The city and state, e.g. San Francisco, CA or a zip code e.g. 95616',
  //               },
  //               movie: { type: 'string', description: 'Any movie title' },
  //             },
  //             required: ['location'],
  //           },
  //         },
  //       },
  //     ],
  //     onProgress: (choices) => {
  //       console.log(`[gemini]`, JSON.stringify(choices));
  //       expect(choices).toBeInstanceOf(Object);
  //     },
  //   });
  //   console.log(`[gemini]result:`, JSON.stringify(result));
  //   expect(result).toBeInstanceOf(Object);
  // }, 30000);
});
