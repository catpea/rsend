# rsend 2.0

Uploading is hard, it is the reason why all the crappy programs exist,
rsend aims to respectfully solve this problem.

It will work with existing SHA256SUM,
and in the future with other ways to discover changes.

The correct way to upload the right files,
is to write all your software correctly.

Rsend is for the people,
who didn't do it right.

## Theory Of Operation

Figure out what files have changed and,
and give the user an object with three arrays: create, update, remove.

This is the solver, there is nothing to it:

```JavaScript

function solver(current, previous){
  const [currentNames, previousNames] = [current, previous].map(list=>list.map(i=>i[1]));
  const [currentHash, previousHash] = [current, previous].map(list=>list.map(i=>i.join('  ')))
  const normal = intersection(currentHash, previousHash).map(i=>i.split('  ')[1])
  const create = difference(currentNames, previousNames);
  const update = difference(intersection(previousNames, currentNames), normal);
  const remove = difference(previousNames, currentNames);
  return { create, update, remove, normal };
}

```

It returns an object with an array of changes.

