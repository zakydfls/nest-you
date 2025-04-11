import { Injectable } from '@nestjs/common';

@Injectable()
export class Helper {
  static generatePagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      totalData: total,
      totalPage: Math.ceil(total / limit),
    };
  }

  static getHoroscope(input: string | Date): string {
    const date = typeof input === 'string' ? new Date(input) : input;

    if (isNaN(date.getTime())) return 'Tanggal tidak valid';

    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      return 'Aries (Ram)';
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      return 'Taurus (Bull)';
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) {
      return 'Gemini (Twins)';
    } else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) {
      return 'Cancer (Crab)';
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return 'Leo (Lion)';
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return 'Virgo (Virgin)';
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) {
      return 'Libra (Balance)';
    } else if ((month === 10 && day >= 24) || (month === 11 && day <= 21)) {
      return 'Scorpius (Scorpion)';
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return 'Sagittarius (Archer)';
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      return 'Capricornus (Goat)';
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return 'Aquarius (Water Bearer)';
    } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
      return 'Pisces (Fish)';
    } else {
      return 'Tanggal tidak valid';
    }
  }
}
