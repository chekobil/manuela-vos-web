import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");
const defaultDateFormat = "D[ ]MMMM[ ]YYYY";
export const formatDate = (date, format = defaultDateFormat) => {
  const notionDateFormat = "YYYY-MM-DD";
  const result = dayjs(date, notionDateFormat).format(format);
  return result;
};
