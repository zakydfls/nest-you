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

  static getZodiac(input: string | Date): string {
    const date = typeof input === 'string' ? new Date(input) : input;

    if (isNaN(date.getTime())) return 'Invalid date';

    const zodiacRanges: { start: string; end: string; zodiac: string }[] = [
      { start: '1912-02-18', end: '1913-02-05', zodiac: 'Rat' },
      { start: '1913-02-06', end: '1914-01-25', zodiac: 'Ox' },
      { start: '1914-01-26', end: '1915-02-13', zodiac: 'Tiger' },
      { start: '1915-02-14', end: '1916-02-02', zodiac: 'Rabbit' },
      { start: '1916-02-03', end: '1917-01-22', zodiac: 'Dragon' },
      { start: '1917-01-23', end: '1918-02-10', zodiac: 'Snake' },
      { start: '1918-02-11', end: '1919-01-31', zodiac: 'Horse' },
      { start: '1919-02-01', end: '1920-02-19', zodiac: 'Goat' },
      { start: '1920-02-20', end: '1921-02-07', zodiac: 'Monkey' },
      { start: '1921-02-08', end: '1922-01-27', zodiac: 'Rooster' },
      { start: '1922-01-28', end: '1923-02-15', zodiac: 'Dog' },
      { start: '1923-02-16', end: '1924-02-04', zodiac: 'Boar' },
      { start: '1924-02-05', end: '1925-01-24', zodiac: 'Rat' },
      { start: '1925-01-25', end: '1926-02-12', zodiac: 'Ox' },
      { start: '1926-02-13', end: '1927-02-01', zodiac: 'Tiger' },
      { start: '1927-02-02', end: '1928-01-22', zodiac: 'Rabbit' },
      { start: '1928-01-23', end: '1929-02-09', zodiac: 'Dragon' },
      { start: '1929-02-10', end: '1930-01-29', zodiac: 'Snake' },
      { start: '1930-01-30', end: '1931-02-16', zodiac: 'Horse' },
      { start: '1931-02-17', end: '1932-02-05', zodiac: 'Goat' },
      { start: '1932-02-06', end: '1933-01-25', zodiac: 'Monkey' },
      { start: '1933-01-26', end: '1934-02-13', zodiac: 'Rooster' },
      { start: '1934-02-14', end: '1935-02-03', zodiac: 'Dog' },
      { start: '1935-02-04', end: '1936-01-23', zodiac: 'Boar' },
      { start: '1936-01-24', end: '1937-02-10', zodiac: 'Rat' },
      { start: '1937-02-11', end: '1938-01-30', zodiac: 'Ox' },
      { start: '1938-01-31', end: '1939-02-18', zodiac: 'Tiger' },
      { start: '1939-02-19', end: '1940-02-07', zodiac: 'Rabbit' },
      { start: '1940-02-08', end: '1941-01-26', zodiac: 'Dragon' },
      { start: '1941-01-27', end: '1942-02-14', zodiac: 'Snake' },
      { start: '1942-02-15', end: '1943-02-04', zodiac: 'Horse' },
      { start: '1943-02-05', end: '1944-01-24', zodiac: 'Goat' },
      { start: '1944-01-25', end: '1945-02-12', zodiac: 'Monkey' },
      { start: '1945-02-13', end: '1946-02-01', zodiac: 'Rooster' },
      { start: '1946-02-02', end: '1947-01-21', zodiac: 'Dog' },
      { start: '1947-01-22', end: '1948-02-09', zodiac: 'Boar' },
      { start: '1948-02-10', end: '1949-01-28', zodiac: 'Rat' },
      { start: '1949-01-29', end: '1950-02-16', zodiac: 'Ox' },
      { start: '1950-02-17', end: '1951-02-05', zodiac: 'Tiger' },
      { start: '1951-02-06', end: '1952-01-26', zodiac: 'Rabbit' },
      { start: '1952-01-27', end: '1953-02-13', zodiac: 'Dragon' },
      { start: '1953-02-14', end: '1954-02-02', zodiac: 'Snake' },
      { start: '1954-02-03', end: '1955-01-23', zodiac: 'Horse' },
      { start: '1955-01-24', end: '1956-02-11', zodiac: 'Goat' },
      { start: '1956-02-12', end: '1957-01-30', zodiac: 'Monkey' },
      { start: '1957-01-31', end: '1958-02-17', zodiac: 'Rooster' },
      { start: '1958-02-18', end: '1959-02-07', zodiac: 'Dog' },
      { start: '1959-02-08', end: '1960-01-27', zodiac: 'Boar' },
      { start: '1960-01-28', end: '1961-02-14', zodiac: 'Rat' },
      { start: '1961-02-15', end: '1962-02-04', zodiac: 'Ox' },
      { start: '1962-02-05', end: '1963-01-24', zodiac: 'Tiger' },
      { start: '1963-01-25', end: '1964-02-12', zodiac: 'Rabbit' },
      { start: '1964-02-13', end: '1965-02-01', zodiac: 'Dragon' },
      { start: '1965-02-02', end: '1966-01-20', zodiac: 'Snake' },
      { start: '1966-01-21', end: '1967-02-08', zodiac: 'Horse' },
      { start: '1967-02-09', end: '1968-01-29', zodiac: 'Goat' },
      { start: '1968-01-30', end: '1969-02-16', zodiac: 'Monkey' },
      { start: '1969-02-17', end: '1970-02-05', zodiac: 'Rooster' },
      { start: '1970-02-06', end: '1971-01-26', zodiac: 'Dog' },
      { start: '1971-01-27', end: '1972-01-15', zodiac: 'Boar' },
      { start: '1972-01-16', end: '1973-02-02', zodiac: 'Rat' },
      { start: '1973-02-03', end: '1974-01-22', zodiac: 'Ox' },
      { start: '1974-01-23', end: '1975-02-10', zodiac: 'Tiger' },
      { start: '1975-02-11', end: '1976-01-30', zodiac: 'Rabbit' },
      { start: '1976-01-31', end: '1977-02-17', zodiac: 'Dragon' },
      { start: '1977-02-18', end: '1978-02-06', zodiac: 'Snake' },
      { start: '1978-02-07', end: '1979-01-27', zodiac: 'Horse' },
      { start: '1979-01-28', end: '1980-02-15', zodiac: 'Goat' },
      { start: '1980-02-16', end: '1981-02-04', zodiac: 'Monkey' },
      { start: '1981-02-05', end: '1982-01-24', zodiac: 'Rooster' },
      { start: '1982-01-25', end: '1983-02-12', zodiac: 'Dog' },
      { start: '1983-02-13', end: '1984-02-01', zodiac: 'Boar' },
      { start: '1984-02-02', end: '1985-02-19', zodiac: 'Rat' },
      { start: '1985-02-20', end: '1986-02-08', zodiac: 'Ox' },
      { start: '1986-02-09', end: '1987-01-28', zodiac: 'Tiger' },
      { start: '1987-01-29', end: '1988-02-16', zodiac: 'Rabbit' },
      { start: '1988-02-17', end: '1989-02-05', zodiac: 'Dragon' },
      { start: '1989-02-06', end: '1990-01-26', zodiac: 'Snake' },
      { start: '1990-01-27', end: '1991-02-14', zodiac: 'Horse' },
      { start: '1991-02-15', end: '1992-02-03', zodiac: 'Goat' },
      { start: '1992-02-04', end: '1993-01-22', zodiac: 'Monkey' },
      { start: '1993-01-23', end: '1994-02-09', zodiac: 'Rooster' },
      { start: '1994-02-10', end: '1995-01-30', zodiac: 'Dog' },
      { start: '1995-01-31', end: '1996-02-18', zodiac: 'Boar' },
      { start: '1996-02-19', end: '1997-02-06', zodiac: 'Rat' },
      { start: '1997-02-07', end: '1998-01-27', zodiac: 'Ox' },
      { start: '1998-01-28', end: '1999-02-15', zodiac: 'Tiger' },
      { start: '1999-02-16', end: '2000-02-04', zodiac: 'Rabbit' },
      { start: '2000-02-05', end: '2001-01-23', zodiac: 'Dragon' },
      { start: '2001-01-24', end: '2002-02-11', zodiac: 'Snake' },
      { start: '2002-02-12', end: '2003-01-31', zodiac: 'Horse' },
      { start: '2003-02-01', end: '2004-01-21', zodiac: 'Goat' },
      { start: '2004-01-22', end: '2005-02-08', zodiac: 'Monkey' },
      { start: '2005-02-09', end: '2006-01-28', zodiac: 'Rooster' },
      { start: '2006-01-29', end: '2007-02-17', zodiac: 'Dog' },
      { start: '2007-02-18', end: '2008-02-06', zodiac: 'Boar' },
      { start: '2008-02-07', end: '2009-01-25', zodiac: 'Rat' },
      { start: '2009-01-26', end: '2010-02-13', zodiac: 'Ox' },
      { start: '2010-02-14', end: '2011-02-02', zodiac: 'Tiger' },
      { start: '2011-02-03', end: '2012-01-22', zodiac: 'Rabbit' },
      { start: '2012-01-23', end: '2013-02-09', zodiac: 'Dragon' },
      { start: '2013-02-10', end: '2014-01-30', zodiac: 'Snake' },
      { start: '2014-01-31', end: '2015-02-18', zodiac: 'Horse' },
      { start: '2015-02-19', end: '2016-02-07', zodiac: 'Goat' },
      { start: '2016-02-08', end: '2017-01-27', zodiac: 'Monkey' },
      { start: '2017-01-28', end: '2018-02-15', zodiac: 'Rooster' },
      { start: '2018-02-16', end: '2019-02-04', zodiac: 'Dog' },
      { start: '2019-02-05', end: '2020-01-24', zodiac: 'Pig' },
      { start: '2020-01-25', end: '2021-02-11', zodiac: 'Rat' },
      { start: '2021-02-12', end: '2022-01-31', zodiac: 'Ox' },
      { start: '2022-02-01', end: '2023-01-21', zodiac: 'Tiger' },
      { start: '2023-01-22', end: '2024-02-09', zodiac: 'Rabbit' },
      { start: '2024-02-10', end: '2025-01-28', zodiac: 'Dragon' },
    ];

    for (const range of zodiacRanges) {
      const start = new Date(range.start);
      const end = new Date(range.end);

      if (date >= start && date <= end) {
        return range.zodiac;
      }
    }

    return 'Unknown';
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
