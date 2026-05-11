define i32 @bad_function() {
    %1 = add i32 1, "not a number"
    ret i32 %1
}
