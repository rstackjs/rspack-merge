const REGEXP_PARTS = /(\*|\?)/g;

class WildcardMatcher {
  private readonly text: string;
  private readonly hasWild: boolean;
  private readonly separator: RegExp;
  private readonly parts: (string | RegExp)[];

  constructor(text: string, separator: RegExp) {
    this.text = text || '';
    this.hasWild = this.text.indexOf('*') >= 0;
    this.separator = separator;
    this.parts = this.text
      .split(this.separator)
      .map(this.classifyPart.bind(this));
  }

  private classifyPart(part: string): string | RegExp {
    if (part === '*') {
      return part;
    } else if (part.indexOf('*') >= 0 || part.indexOf('?') >= 0) {
      return new RegExp(part.replace(REGEXP_PARTS, '\.$1'));
    }
    return part;
  }

  match(input: string): string[] | false {
    let matches = true;
    let ii: number;
    const partsCount = this.parts.length;
    let testParts: string[] | undefined;

    if (!this.hasWild && this.text !== input) {
      return false;
    } else {
      testParts = (input || '').split(this.separator);
      for (ii = 0; matches && ii < partsCount; ii++) {
        if (this.parts[ii] === '*') {
          continue;
        } else if (ii < testParts.length) {
          matches =
            this.parts[ii] instanceof RegExp
              ? (this.parts[ii] as RegExp).test(testParts[ii])
              : this.parts[ii] === testParts[ii];
        } else {
          matches = false;
        }
      }
    }

    return matches && testParts;
  }
}

export default function wildcard(
  text: string,
  test: string,
  separator?: RegExp,
): string[] | boolean {
  const matcher = new WildcardMatcher(text, separator || /[\/\.]/);
  return matcher.match(test);
}
