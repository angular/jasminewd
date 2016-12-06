PASSING_SPECS="spec/support/passing_specs.json"
FAILING_SPECS="spec/support/failing_specs.json"
CMD_BASE="node node_modules/.bin/jasmine JASMINE_CONFIG_PATH="

echo "### running passing specs"
CMD=$CMD_BASE$PASSING_SPECS
echo "### $CMD"
$CMD
[ "$?" -eq 0 ] || exit 1
echo

EXPECTED_RESULTS="18 specs, 16 failures"
echo "### running failing specs (expecting $EXPECTED_RESULTS)"
CMD=$CMD_BASE$FAILING_SPECS
echo "### $CMD"
res=`$CMD 2>/dev/null`
results_line=`echo "$res" | tail -2 | head -1`
echo "result: $results_line"
[ "$results_line" = "$EXPECTED_RESULTS" ] || exit 1

echo "all pass"
