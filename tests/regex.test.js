import { getMdImageData } from "../scripts/lib/notion";

describe("getMdImageData method", () => {
  test("Extrae, text, url, filename", () => {
    const link =
      "![](https://prod-files-secure.s3.us-west-2.amazonaws.com/60166dce-8aec-4956-8125-d1dd7af50a5b/462a162e-2de9-432d-acaa-15cef6e30a7c/manu-radio-silla.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45HZZMZUHI%2F20241002%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20241002T055740Z&X-Amz-Expires=3600&X-Amz-Signature=11ddb8d6ae5f4b854a3d82488c6a315022f4ac20380e989b4399f33d40d53a01&X-Amz-SignedHeaders=host&x-id=GetObject)";
    const expected = "manu-radio-silla.jpg";
    const { filename } = getMdImageData(link);
    expect(filename).toBe(expected);
  });
  test("Extrae, text, url, filename", () => {
    const link =
      "![](https://www.telemadrid.es/2022/11/28/corporativo/sala-de-prensa/_2509859022_39219555_1300x731.jpg)";
    const expected = "_2509859022_39219555_1300x731.jpg";
    const { filename } = getMdImageData(link);
    expect(filename).toBe(expected);
  });
  test("Extrae, url de in iframe embebido", () => {
    const link =
      "[image](http://players.brightcove.net/104403117001/Lti7DzQ054_default/index.html?videoId=6316122537112)";
    const expected =
      "http://players.brightcove.net/104403117001/Lti7DzQ054_default/index.html?videoId=6316122537112";
    const data = getMdImageData(link, "embed");
    expect(data.url).toBe(expected);
    expect(data.text).toBe("image");
  });
});
