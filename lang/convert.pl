#!/usr/bin/perl

$file = $ARGV[0];

if($file =~ /\.xml$/){
	$o = fromXML($file);
}else{
	$o = fromTXT($file);
}
print $o;

sub fromXML {
	my $xml = $_[0];
	my (%dict,@xmllines,@lines,$line,$output);
	
	open(FILE,$xml);
	@xmllines = <FILE>;
	close(FILE);

	open(FILE,"en.txt");
	@lines = <FILE>;
	close(FILE);

	%dict;
	$output = "";
	
	foreach $line (@xmllines){
		if($line =~ /<([^\>]*)>([^\<]*)<\/\1>/){
			$dict{$1} = $2;
		}
	}

	foreach $line (@lines){
		if($line =~ /^([^\:]*)\:([\s\t]*)\"(.*)\"$/){
			$output .= "$1\:$2\"".($dict{$1} ? $dict{$1} : $3)."\"\n";
		}else{
			$output .= $line;
		}
	}
	return $output;
}

sub fromTXT {
	my $file = $_[0];
	my (%dict,@txtlines,@lines,$line,$output);
	
	open(FILE,$file);
	@txtlines = <FILE>;
	close(FILE);

	open(FILE,"en.txt");
	@lines = <FILE>;
	close(FILE);

	%dict;
	$output = "";
	
	foreach $line (@txtlines){
		$line =~ s/[\n\r]//g;
		if($line =~ /^([^\t]*)\s?\t\s?([^\t]*)$/){
			$key = $1;
			$value = $2;
			$key =~ s/[\t\s]*$//g;
			if($key =~ /Deciduous/){ print "==$key==$value==\n"; }
			$dict{$key} = $value;
			$dict{$key.":"} = $value;
		}
	}

	foreach $line (@lines){
		if($line =~ /^([^\:]*)\:([\s\t]*)\"(.*)\"$/){
			$output .= "$1\:$2\"".($dict{$3} ? $dict{$3} : ($dict{$3+":"} ? $dict{$3+":"} : $3))."\"\n";
		}else{
			$output .= $line;
		}
	}
	return $output;
}