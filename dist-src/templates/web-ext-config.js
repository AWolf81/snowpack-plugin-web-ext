export default ({ run: { target: browserTarget }, sourceDir }) => ({
    run: {
        target: Array.isArray(browserTarget) ? browserTarget : [browserTarget],
        noReload: false
    },
    sourceDir
});
