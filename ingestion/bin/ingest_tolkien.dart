import 'dart:io';

import 'package:args/args.dart';
import 'package:nice_json/nice_json.dart';

import '../utils/colours.dart';

final _parser = ArgParser()
  ..addOption('infile', abbr: 'i', defaultsTo: 'data/tolkien.txt')
  ..addOption('outdir', abbr: 'o', defaultsTo: 'data');

//((#([\S]+)#,[\s]*)+\s_([\w\d\.]+)_\s)+
final _entrySplitRegex = RegExp('^#', multiLine: true);

void main(List<String> argss) {
  final args = _parser.parse(argss);
  final inFile = args['infile'] as String;
  final outDir = args['outdir'] as String;
  final raw = File(inFile).readAsStringSync();
  final entryIndices =
      _entrySplitRegex.allMatches(raw).map((e) => e.start).toList();
  final entries = [
    for (final (i, e) in entryIndices.indexed)
      raw
          .substring(
              e, i < entryIndices.length - 1 ? entryIndices[i + 1] : null)
          .trim()
          .replaceAll('\n', ''),
  ];

  // final tokenisedEntries = entries.map(tokeniseEntry).toList();
  // print(tokenisedEntries.first.join('\n'));

  final metadata = entries.map(parseEntry).toList();

  // word | part of speech mapped to entry
  final lookups = metadata.indexed
      .map((e) =>
          [for (String word in e.$2.$1) ('$word | ${e.$2.$2}', '${e.$1}')])
      .expand((e) => e);

  final lookupMap = {
    for (final e in lookups) e.$1: e.$2,
  };
  final lookupJson = niceJson(lookupMap);
  File('$outDir/lookup.json').writeAsStringSync(lookupJson);
  print(yellow('Wrote ${lookupMap.length} entries to $outDir/lookup.json'));

  final entriesMap = {
    for (final e in entries.indexed) '${e.$1}': e.$2,
  };
  final entriesJson = niceJson(entriesMap);
  File('$outDir/dict.json').writeAsStringSync(entriesJson);
  print(yellow('Wrote ${entriesMap.length} entries to $outDir/dict.json'));

  // 460 duplicates for you to figure out at some point
  // final x = wordMappings.map((e) => e.$1).toList();
  // final y = x.toSet();
  // print(x.length);
  // print(y.length);
  // for (final z in y) {
  //   x.remove(z);
  // }
  // print(x);
}

final _tokeniseRegex = RegExp(r'[,;]');
final _wordsRegex = RegExp(r'#([^#]+)#');
// Matches a bracketed expression, e.g. finds (u) in Occupacio(u)n
final _bracketedRegex = RegExp(r'(\(([^(^)]+)\))');
final _partOfSpeechRegex = RegExp(r'_(([^_]+\.))_');

(List<String> words, String? partOfSpeech) parseEntry(String entry) =>
    (findAndExpandWords(entry), findPartOfSpeech(entry));

List<String> tokeniseEntry(String entry) => entry.split(_tokeniseRegex);

List<String> findAndExpandWords(String entry) =>
    findWords(entry).map(expandVariants).expand((e) => e).toList();

List<String> findWords(String entry) =>
    _wordsRegex.allMatches(entry).map((e) => e.group(1)!).toList();

// todo: handle cases with multiple optional components
// e.g.: expands 'Occupacio(u)n to ['Occupacion', 'Occupatioun']
List<String> expandVariants(String word) {
  final matches = _bracketedRegex.allMatches(word);
  if (matches.isEmpty) {
    return [word];
  }
  return [
    word.replaceAll(_bracketedRegex, ''),
    word.replaceAllMapped(_bracketedRegex, (m) => m.group(2)!),
  ];
  // note to self: write a version of replaceAllMaps that uses
  // precomputed matches and put it in `elegant`
}

// this only accounts for the first part of speech in the entry
// e.g. #Smyte#, #Smytte#, _v._ to smite, V 192, XVII 215, 218, 220; to rebuke,
//IV _b_ 76; #Smytte#, _pp._ XVI 338. [OE. _smītan_, smear.]
// we lose the pp here (hehe), and in this case it's ok but will be important
// in others
String? findPartOfSpeech(String entry) =>
    _partOfSpeechRegex.firstMatch(entry)?.group(1);

// void parseEntry(List<String> tokens) {
//   List<String> words = [];
//   List<String> accumulator = [];

//   for (final token in tokens) {
//     final trimmed = token.trim();
//     // it be a word
//     if (trimmed.startsWith('#') && trimmed.endsWith('#')) {
//       accumulator.add(trimmed.substring(1, trimmed.length - 1));
//     }
//   }
// }

// to cal from alex
final _boldRegex = RegExp(r'#([^#]+)#');
final _italicRegex = RegExp(r'_(([^_]+))_');

String htmlise(String entry) => entry
    .replaceAllMapped(_boldRegex, (m) => '<b>${m.group(1)}</b>')
    .replaceAllMapped(_italicRegex, (m) => '<i>${m.group(1)}</i>');
