#!/usr/bin/perl

$xml = $ARGV[0];

open(FILE,$xml);
@xmllines = <FILE>;
close(FILE);

open(FILE,"en.txt");
@lines = <FILE>;
close(FILE);

%dict;

foreach $line (@xmllines){
	if($line =~ /<([^\>]*)>([^\<]*)<\/\1>/){
		$dict{$1} = $2;
	}
}

foreach $line (@lines){
	if($line =~ /^([^\:]*)\:([\s\t]*)\"(.*)\"$/){
		print "$1\:$2\"".($dict{$1} ? $dict{$1} : $3)."\"\n";
	}else{
		print $line;
	}
}