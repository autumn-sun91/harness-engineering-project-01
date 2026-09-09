import type { Category } from "../../src/types";

/**
 * 초안 라벨이다. 실제 카드 명세서를 아는 사람이 정답 카테고리를 검수해야
 * 분류 품질 평가 결과를 신뢰할 수 있다.
 */
export const merchantSamples: ReadonlyArray<{
  merchant: string;
  expectedCategory: Category;
}> = [
  { merchant: "스타벅스", expectedCategory: "식비" },
  { merchant: "배달의민족", expectedCategory: "식비" },
  { merchant: "편의점", expectedCategory: "식비" },
  { merchant: "카카오t", expectedCategory: "교통" },
  { merchant: "서울교통공사", expectedCategory: "교통" },
  { merchant: "주유소", expectedCategory: "교통" },
  { merchant: "월세", expectedCategory: "주거" },
  { merchant: "관리비", expectedCategory: "주거" },
  { merchant: "skt", expectedCategory: "통신" },
  { merchant: "인터넷요금", expectedCategory: "통신" },
  { merchant: "서울아산병원", expectedCategory: "의료" },
  { merchant: "약국", expectedCategory: "의료" },
  { merchant: "쿠팡", expectedCategory: "쇼핑" },
  { merchant: "무신사", expectedCategory: "쇼핑" },
  { merchant: "이마트", expectedCategory: "쇼핑" },
  { merchant: "넷플릭스", expectedCategory: "구독" },
  { merchant: "유튜브 프리미엄", expectedCategory: "구독" },
  { merchant: "멜론", expectedCategory: "구독" },
  { merchant: "세무서", expectedCategory: "기타" },
  { merchant: "토스 송금", expectedCategory: "기타" },
  { merchant: "우체국", expectedCategory: "기타" },
  { merchant: "정부24", expectedCategory: "기타" },
  { merchant: "택배", expectedCategory: "기타" },
  { merchant: "온라인 서비스", expectedCategory: "기타" },
];
