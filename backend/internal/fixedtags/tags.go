package fixedtags

import (
	"strings"
	"unicode"
)

var Labels = []string{"后入", "奶子", "口交", "臀", "人妻", "女大", "AV", "双飞", "内射", "黑丝", "技师", "空姐", "护士", "教师", "主播", "绿帽", "露出", "偷拍", "颜射", "喷水", "车震", "办公室", "模特", "秘书", "捆绑", "骑乘"}

var aliases = map[string][]string{
	"后入": {"后入", "後入", "后入式", "後入式", "后进", "後進", "后位", "後位", "背入", "背后", "后背", "背后式", "后背位", "狗爬", "狗爬式", "追尾", "doggy", "doggystyle", "doggy style", "doggy-style", "backshot", "back shot", "back-shot", "from behind", "rear entry"},
	"奶子": {"奶子", "奶", "大奶", "巨乳", "美乳", "爆乳", "丰乳", "丰胸", "大胸", "胸", "胸部", "胸器", "胸前", "揉胸", "揉奶", "揉乳", "双乳", "乳房", "乳头", "美胸", "boob", "boobs", "big boobs", "big-boobs", "tits", "titties", "titty", "breast", "breasts"},
	"口交": {"口交", "口爆", "口活", "口射", "吹箫", "吹萧", "深喉", "吞精", "含屌", "含鸡巴", "含龟头", "舔屌", "bj", "blowjob", "blow job", "oral", "oral sex", "oral-sex", "oralsex", "fellatio"},
	"臀":  {"臀", "屁股", "屁屁", "翘臀", "美臀", "肥臀", "巨臀", "蜜桃臀", "大屁股", "尻", "后庭", "後庭", "菊花", "肛", "肛交", "屁眼", "ass", "big ass", "big-ass", "butt", "big butt", "big-butt", "booty", "buttocks", "hip"},
	"人妻": {"人妻", "妻子", "老婆", "太太", "少妇", "少熟", "熟女", "已婚", "良家", "人妇", "人夫", "wife", "housewife", "married", "married woman", "young wife", "milf"},
	"女大": {"女大", "女大学生", "大学生", "女子大生", "大学", "女学生", "学生妹", "校花", "学妹", "校园", "大一", "大二", "大三", "大四", "college", "college student", "university", "university student", "campus", "coed"},
	"AV": {"AV", "JAV", "番号", "番號"},
	"双飞": {"双飞", "3P", "三人", "多人", "群交"},
	"内射": {"内射", "中出", "灌精", "creampie"},
	"黑丝": {"黑丝", "黑丝袜", "肉丝", "白丝", "丝袜"},
	"技师": {"技师", "按摩", "spa", "推油"},
	"空姐": {"空姐", "航空", "乘务"},
	"护士": {"护士", "白衣天使"},
	"教师": {"老师", "教师", "家教"},
	"主播": {"主播", "网红", "直播"},
	"绿帽": {"绿帽", "绿帽献妻", "单男", "换妻", "交换"},
	"露出": {"露出", "露脸", "户外", "公共场合"},
	"偷拍": {"偷拍", "暗拍"},
	"颜射": {"颜射", "射脸", "口爆"},
	"喷水": {"喷水", "潮吹", "squirt"},
	"车震": {"车震", "车里", "车内"},
	"办公室": {"办公室", "职场", "办公"},
	"模特": {"模特"},
	"秘书": {"秘书", "OL"},
	"捆绑": {"捆绑", "调教"},
	"骑乘": {"骑乘", "女上", "女上位"},
}

func AliasesFor(label string) []string {
	values := aliases[label]
	out := make([]string, len(values))
	copy(out, values)
	return out
}

func MatchFilename(name string) []string {
	text := normalize(name)
	out := make([]string, 0, len(Labels))
	for _, label := range Labels {
		for _, alias := range aliases[label] {
			if text.contains(alias) {
				out = append(out, label)
				break
			}
		}
	}
	return out
}

type normalizedText struct {
	lower   string
	compact string
	tokens  map[string]struct{}
}

func normalize(s string) normalizedText {
	lower := strings.ToLower(s)
	var compact strings.Builder
	var spaced strings.Builder
	for _, r := range lower {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			compact.WriteRune(r)
			spaced.WriteRune(r)
			continue
		}
		spaced.WriteByte(' ')
	}

	tokens := make(map[string]struct{})
	for _, token := range strings.Fields(spaced.String()) {
		tokens[token] = struct{}{}
	}

	return normalizedText{
		lower:   lower,
		compact: compact.String(),
		tokens:  tokens,
	}
}

func (n normalizedText) contains(alias string) bool {
	lowerAlias := strings.ToLower(alias)
	compactAlias := compact(lowerAlias)
	if compactAlias == "" {
		return false
	}
	if isShortASCIIWord(compactAlias) && compactAlias == lowerAlias {
		_, ok := n.tokens[compactAlias]
		return ok
	}
	if strings.Contains(n.lower, lowerAlias) {
		return true
	}
	return strings.Contains(n.compact, compactAlias)
}

func compact(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func isShortASCIIWord(s string) bool {
	if len(s) > 3 {
		return false
	}
	for _, r := range s {
		if r > unicode.MaxASCII || (!unicode.IsLetter(r) && !unicode.IsDigit(r)) {
			return false
		}
	}
	return true
}
