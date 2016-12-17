LIB_SPECS="spec/support/lib_specs.json"
PASSING_SPECS="spec/support/passing_specs.json"
FAILING_SPECS="spec/support/failing_specs.json"
NO_CF_PASSING_SPECS="spec/support/no_cf_passing_specs.json"
NO_CF_FAILING_SPECS="spec/support/no_cf_failing_specs.json"
CMD_BASE="node node_modules/.bin/jasmine JASMINE_CONFIG_PATH="

# Run unit tests

echo "### running all unit tests"
CMD=$CMD_BASE$LIB_SPECS
echo "### $CMD"
$CMD
[ "$?" -eq 0 ] || exit 1
echo


# Run all tests when the control flow is enabled

export SELENIUM_PROMISE_MANAGER=1

echo "### running all passing specs"
CMD=$CMD_BASE$PASSING_SPECS
echo "### $CMD"
$CMD
[ "$?" -eq 0 ] || exit 1
echo

EXPECTED_RESULTS="38 specs, 34 failures"
echo "### running all failing specs (expecting $EXPECTED_RESULTS)"
CMD=$CMD_BASE$FAILING_SPECS
echo "### $CMD"
res=`$CMD 2>/dev/null`
results_line=`echo "$res" | tail -2 | head -1`
echo "result: $results_line"
[ "$results_line" = "$EXPECTED_RESULTS" ] || exit 1

# Run only the async/await tests when the control flow is disabled

export SELENIUM_PROMISE_MANAGER=0

echo "### running async/await passing specs"
CMD=$CMD_BASE$NO_CF_PASSING_SPECS
echo "### $CMD"
$CMD
[ "$?" -eq 0 ] || exit 1
echo

EXPECTED_RESULTS="19 specs, 17 failures"
echo "### running async/await failing specs (expecting $EXPECTED_RESULTS)"
CMD=$CMD_BASE$NO_CF_FAILING_SPECS
echo "### $CMD"
res=`$CMD 2>/dev/null`
results_line=`echo "$res" | tail -2 | head -1`
echo "result: $results_line"
[ "$results_line" = "$EXPECTED_RESULTS" ] || exit 1


echo "all pass"
