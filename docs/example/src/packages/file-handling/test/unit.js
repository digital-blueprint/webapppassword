import '../src/dbp-file-source';
import '../src/demo';

describe('dbp-file-source basics', () => {
  let node;

  beforeEach(async () => {
    node = document.createElement('dbp-file-source');
    document.body.appendChild(node);
    await node.updateComplete;
  });

  afterEach(() => {
    node.remove();
  });

  it('should render', () => {
      expect(node).to.have.property('shadowRoot');
  });
});

describe('dbp-file-source demo', () => {
  let node;

  beforeEach(async () => {
    node = document.createElement('dbp-file-source-demo');
    document.body.appendChild(node);
    await node.updateComplete;
  });

  afterEach(() => {
    node.remove();
  });

  it('should render', () => {
      expect(node).to.have.property('shadowRoot');
  });
});
