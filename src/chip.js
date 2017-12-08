let V = new Uint8Array(16);
let I = new Uint16Array(1);

function createMatcher(opcode) {
  let matcher = '^';
  let kCount = 0, nCount = 0;
  for (let c of opcode) {
    switch (c) {
    case 'x':
    case 'y':
      matcher += '([0-9a-f])';
      break;
    case 'k':
      if (!kCount)
        matcher += '([0-9a-f]{2})';
      ++kCount;
      break;
    case 'n':
      if (!nCount)
        matcher += '([0-9a-f]{3})';
      ++nCount;
      break;
    default:
      matcher += c;
      break;
    }
  }
  matcher += '$';
  return new RegExp(matcher, 'i');
}

let instructions = [
  {
    // MOVE 
    matcher: '6xkk',
    exec: (x,kk) => V[x] = kk
  },
  {
    // MOVE 
    matcher: '8xy0',
    exec: (x,y) => V[x] = V[y]
  },
  {
    // ADD
    matcher: '7xkk',
    exec: (x,kk) => V[x] += kk
  },
  {
    // ADD
    matcher: '8xy4',
    exec: (x,y) => { 
      let sum = V[x] + V[y];
      V[x] = sum;
      V[0xf] = V[x] !== sum; // set carry if overflow 
    }
  },
  {
    // SUB
    matcher: '8xy5',
    exec: (x,y) => {
      V[0xf] = V[x] > V[y]; // borrowing
      V[x] = V[x] - V[y];
    }
  },
  {
    // SUBN
    matcher: '8xy7',
    exec: (x,y) => {
      V[0xf] = V[y] > V[x]; // borrowing
      V[x] = V[y] - V[x];
    }
  },
  { 
    // AND
    matcher: '8xy2',
    exec: (x,y) => V[x] &= V[y]
  },
  { 
    // OR
    matcher: '8xy1',
    exec: (x,y) => V[x] |= V[y] 
  },
  { 
    // XOR
    matcher: '8xy3',
    exec: (x,y) => V[x] ^= V[y] 
  },
  {
    // SHR
    matcher: '8xy6',
    exec: (x,y) => 
    {
      V[0xf] = x & 1;
      V[x] >>= 1; 
    }
  },
  {
    // SHL Vx {, Vy} Set Vx = Vx SHL 1.
    matcher: '8xyE',
    exec: (x,y) => {
      V[0xf] = x & 0x80;
      V[x] <<= 1;
    } 
  },
  {
    // RND
    matcher: 'Cxkk',
    exec: (x,kk) => V[x] = (Math.random() * 0xff | 0) & kk
  },
];
