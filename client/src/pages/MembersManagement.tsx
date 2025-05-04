// src/components/MemberList.tsx
import React, { useState } from 'react';
import { useGetMembersQuery } from '@/features/member/memberApi';
import { Member } from '@/types/memberTypes';
import MemberDeleteButton from '@/components/member/MemberDeleteButton';
import { Link } from 'react-router'; // Corrected import

// Import shadcn/ui components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Import Lucide icons
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  History, 
  User, 
  Users,
  Mail,
  ArrowUpDown
} from 'lucide-react';

const MemberList: React.FC = () => {
  const { data: members, error, isLoading } = useGetMembersQuery();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter members based on search term
  const filteredMembers = members?.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">
              Error Loading Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">There was a problem loading the member list. Please try again later.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!members || members.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <Link to="/members/create">
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Members Found</h3>
            <p className="text-gray-500 mb-6 text-center">Get started by adding your first member to the system.</p>
            <Link to="/members/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Member
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Members list view
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
              <Badge variant="outline" className="ml-2 text-xs">
                {members.length}
              </Badge>
            </CardTitle>
            <Link to="/members/create">
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Member
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers && filteredMembers.length > 0 ? (
                  filteredMembers.map((member: Member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8 bg-gray-100">
                          <AvatarFallback className="text-xs text-gray-600">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{member.name}</div>
                        <div className="md:hidden text-sm text-gray-500">
                          {member.email || 'No email provided'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.email ? (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-2 text-gray-500" />
                            <span>{member.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link to={`/members/${member.id}/transactions`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <History className="h-4 w-4 mr-2" />
                                View Transactions
                              </DropdownMenuItem>
                            </Link>
                            <Link to={`/members/edit/${member.id}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Member
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                              <MemberDeleteButton 
                                memberId={member.id} 
                                memberName={member.name}
                                customTrigger={
                                  <div className="flex items-center w-full">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </div>
                                }
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No members found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-gray-500 border-t px-6 py-4">
          <div>
            Showing {filteredMembers?.length || 0} of {members.length} members
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MemberList;